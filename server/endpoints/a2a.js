const { reqBody } = require("../utils/http");
const { getAgentCard } = require("../utils/a2aAgentCard");
const { createTask, getTask, cancelTask, setStatus } = require("../utils/a2aTasks");
const {
  setPushNotificationConfig: setPushConfig,
  getPushNotificationConfig: getPushConfig,
} = require("../utils/a2aPushNotifications");
const bus = require("../utils/eventBus");
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

function out(id, result) {
  return { jsonrpc: "2.0", id, result };
}
function jsonError(res, id, code, message) {
  return res.status(400).json({ jsonrpc: "2.0", id, error: { code, message } });
}

function wantsStructuredJson(message) {
  return Array.isArray(message.parts) && message.parts.some(p => p.kind === 'text' && p.text.includes('{'));
}
function shouldAskForMore(message) {
  return Array.isArray(message.parts) && message.parts.some(p => p.kind === 'text' && /flight/i.test(p.text));
}
function hasFilePart(message) {
  return Array.isArray(message.parts) && message.parts.some(p => p.kind === 'file');
}
async function annotateFaces(parts) {
  const file = parts.find(p => p.kind === 'file');
  if (!file?.file?.bytes) return null;
  const buf = Buffer.from(file.file.bytes, 'base64');
  const filePath = `/tmp/${uuidv4()}.png`;
  await fs.promises.writeFile(filePath, buf);
  return `file://${filePath}`;
}
function extractSchema(_task) {
  return {};
}
function makeJsonArtifact(data) {
  return {
    artifactId: uuidv4(),
    name: 'data.json',
    parts: [{ kind: 'json', text: JSON.stringify(data) }],
  };
}
async function fulfilTask(task, followUpMessage = null) {
  if (task.metadata?.structured) {
    task.artifacts = [makeJsonArtifact(extractSchema(task))];
  }
  setStatus(task, "completed", [{ kind: "text", text: "Done! See artifacts for details." }]);
}

function a2aEndpoints(app) {
  if (!app) return;

  const agentCard = getAgentCard();

  app.get("/.well-known/agent.json", (_req, res) => {
    res.json(agentCard);
  });

  app.post("/a2a/api", async (req, res) => {
    try {
      const body = reqBody(req);
      if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
        return jsonError(res, body?.id ?? null, -32600, "Invalid Request");
      }

      switch (body.method) {
        case "message/send": {
          const { message } = body.params || {};
          if (!message) return jsonError(res, body.id, -32602, "Invalid params");
          const { taskId } = message;

          if (!taskId) {
            const task = createTask(message, { structured: wantsStructuredJson(message) });
            if (hasFilePart(message)) {
              const processedUri = await annotateFaces(message.parts);
              task.artifacts = [
                {
                  artifactId: uuidv4(),
                  name: "processed_image.png",
                  parts: [
                    { kind: "file", file: { name: "faces.png", mimeType: "image/png", uri: processedUri } },
                  ],
                },
              ];
              setStatus(task, "completed");
            } else if (shouldAskForMore(message)) {
              setStatus(task, "input-required", [
                { kind: "text", text: "Where would you like to fly from / to and on what dates?" },
              ]);
            } else {
              fulfilTask(task);
            }
            return res.json(out(body.id, task));
          }

          const task = getTask(taskId);
          if (!task) return jsonError(res, body.id, -32001, "Task not found");
          task.history.push(message);
          if (task.status.state === "input-required") {
            setStatus(task, "working");
            await fulfilTask(task, message);
          } else {
            return jsonError(res, body.id, -32002, "Task not accepting input");
          }
          return res.json(out(body.id, task));
        }
        case "message/stream": {
          const { message } = body.params || {};
          if (!message) return jsonError(res, body.id, -32602, "Invalid params");
          const task = createTask(message, { structured: wantsStructuredJson(message) });

          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Connection", "keep-alive");
          res.flushHeaders();
          res.write(`data:${JSON.stringify(out(body.id, task))}\n\n`);

          const channel = `task:${task.id}`;
          const listener = ev => res.write(`data:${JSON.stringify(ev)}\n\n`);
          bus.on(channel, listener);
          req.on("close", () => bus.off(channel, listener));

          if (hasFilePart(message)) {
            const processedUri = await annotateFaces(message.parts);
            task.artifacts = [
              {
                artifactId: uuidv4(),
                name: "processed_image.png",
                parts: [
                  { kind: "file", file: { name: "faces.png", mimeType: "image/png", uri: processedUri } },
                ],
              },
            ];
            setStatus(task, "completed");
          } else if (shouldAskForMore(message)) {
            setStatus(task, "input-required", [
              { kind: "text", text: "Where would you like to fly from / to and on what dates?" },
            ]);
          } else {
            fulfilTask(task);
          }
          return;
        }
        case "tasks/get": {
          const id = body.params?.id;
          const task = id ? getTask(id) : null;
          if (!task) return jsonError(res, body.id, -32001, "Task not found");
          return res.json(out(body.id, task));
        }
        case "tasks/cancel": {
          const id = body.params?.id;
          const task = id ? cancelTask(id) : null;
          if (!task) return jsonError(res, body.id, -32001, "Task not found");
          return res.json(out(body.id, task));
        }
        case "tasks/resubscribe": {
          const id = body.params?.id;
          const task = id ? getTask(id) : null;
          if (!task) return jsonError(res, body.id, -32001, "Task not found");

          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Connection", "keep-alive");
          res.flushHeaders();
          const channel = `task:${task.id}`;
          const listener = ev => res.write(`data:${JSON.stringify(ev)}\n\n`);
          bus.on(channel, listener);
          req.on("close", () => bus.off(channel, listener));
          res.write(`data:${JSON.stringify({ taskId: task.id, event: 'status', payload: task.status })}\n\n`);
          return;
        }
        case "tasks/pushNotificationConfig/set": {
          const { id: tId, pushNotificationConfig } = body.params || {};
          const cfg = setPushConfig(tId, pushNotificationConfig);
          if (!cfg) return jsonError(res, body.id, -32602, "Invalid params");
          const task = getTask(tId);
          if (task) task.pushConfig = cfg;
          return res.json(out(body.id, cfg));
        }
        case "tasks/pushNotificationConfig/get": {
          const cfg = getPushConfig(body.params?.id);
          if (!cfg) return jsonError(res, body.id, -32004, "Push notifications not configured");
          return res.json(out(body.id, cfg));
        }
        default:
          return jsonError(res, body.id, -32601, "Method not found");
      }
    } catch (e) {
      console.error("A2A endpoint error", e);
      res.status(500).json({ jsonrpc: "2.0", id: null, error: { code: -32603, message: "Internal server error" } });
    }
  });
}

module.exports = { a2aEndpoints };
