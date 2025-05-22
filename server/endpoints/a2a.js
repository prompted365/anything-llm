const { reqBody } = require("../utils/http");

function a2aEndpoints(app) {
  if (!app) return;

  const agentCard = {
    name: "AnythingLLM A2A Agent",
    description: "AnythingLLM exposes features via Google's Agent2Agent protocol.",
    url: `${process.env.PUBLIC_BASE_URL || ""}/a2a/api`,
    version: "0.1.0",
    capabilities: {
      streaming: false,
      pushNotifications: false,
    },
    defaultInputModes: ["application/json", "text/plain"],
    defaultOutputModes: ["application/json"],
    skills: [
      {
        id: "chat",
        name: "Chat",
        description: "Handle chat messages via AnythingLLM",
        tags: ["chat"],
      },
    ],
  };

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
          return res.json({
            jsonrpc: "2.0",
            id: body.id,
            result: {
              role: "agent",
              parts: [
                { kind: "text", text: "A2A integration placeholder" },
              ],
              messageId: message.messageId || "",
              contextId: message.contextId || null,
              kind: "message",
              metadata: {},
            },
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
