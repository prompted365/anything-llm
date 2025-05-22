const { reqBody } = require("../utils/http");
const { getAgentCard } = require("../utils/a2aAgentCard");
const { createTask, getTask, cancelTask } = require("../utils/a2aTasks");

function a2aEndpoints(app) {
  if (!app) return;

  const agentCard = getAgentCard();

  app.get("/.well-known/agent.json", (_req, res) => {
    res.json(agentCard);
  });

  app.post("/a2a/api", (req, res) => {
    try {
      const body = reqBody(req);
      if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
        return res.status(400).json({
          jsonrpc: "2.0",
          id: body?.id ?? null,
          error: { code: -32600, message: "Invalid Request" },
        });
      }

      switch (body.method) {
        case "message/send": {
          const message = body.params?.message;
          if (!message) {
            return res.status(400).json({
              jsonrpc: "2.0",
              id: body.id,
              error: { code: -32602, message: "Invalid params" },
            });
          }
          const task = createTask(message);
          return res.json({ jsonrpc: "2.0", id: body.id, result: task });
        }
        case "message/stream": {
          const message = body.params?.message;
          if (!message) {
            return res.status(400).json({
              jsonrpc: "2.0",
              id: body.id,
              error: { code: -32602, message: "Invalid params" },
            });
          }
          const task = createTask(message);
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Connection", "keep-alive");
          res.flushHeaders();
          const event = { jsonrpc: "2.0", id: body.id, result: task };
          res.write(`data: ${JSON.stringify(event)}\n\n`);
          res.end();
          return;
        }
        case "tasks/get": {
          const id = body.params?.id;
          const task = id ? getTask(id) : null;
          if (!task) {
            return res.status(400).json({
              jsonrpc: "2.0",
              id: body.id,
              error: { code: -32001, message: "Task not found" },
            });
          }
          return res.json({ jsonrpc: "2.0", id: body.id, result: task });
        }
        case "tasks/cancel": {
          const id = body.params?.id;
          const task = id ? cancelTask(id) : null;
          if (!task) {
            return res.status(400).json({
              jsonrpc: "2.0",
              id: body.id,
              error: { code: -32001, message: "Task not found" },
            });
          }
          return res.json({ jsonrpc: "2.0", id: body.id, result: task });
        }
        case "tasks/resubscribe": {
          return res.status(400).json({
            jsonrpc: "2.0",
            id: body.id,
            error: { code: -32004, message: "Streaming not yet supported" },
          });
        }
        case "tasks/pushNotificationConfig/set":
        case "tasks/pushNotificationConfig/get": {
          return res.status(400).json({
            jsonrpc: "2.0",
            id: body.id,
            error: { code: -32004, message: "Push notifications not supported" },
          });
        }
        default:
          return res.status(400).json({
            jsonrpc: "2.0",
            id: body.id,
            error: { code: -32601, message: "Method not found" },
          });
      }
    } catch (e) {
      console.error("A2A endpoint error", e);
      res.status(500).json({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message: "Internal server error" },
      });
    }
  });
}

module.exports = { a2aEndpoints };
