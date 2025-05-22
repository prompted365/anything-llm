const { AgentOrchestrator } = require("../utils/orchestrator");
const { taskQueue } = require("../utils/taskQueue");

function orchestratorEndpoints(app) {
  if (!app) return;
  const orchestrator = new AgentOrchestrator();

  app.get("/orchestrator/modes", (_req, res) => {
    res.json({ modes: orchestrator.listModes() });
  });

  app.post("/orchestrator/delegate", (req, res) => {
    try {
      const { slug, payload, options } = req.body || {};
      if (!slug) return res.status(400).json({ error: "slug required" });
      const id = orchestrator.delegate(slug, payload, options);
      res.json({ taskId: id });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/orchestrator/tasks/:id/pause", (req, res) => {
    const { id } = req.params;
    taskQueue.awaitHuman(id);
    res.json({ id, status: "awaiting-human" });
  });

  app.post("/orchestrator/tasks/:id/resume", (req, res) => {
    const { id } = req.params;
    taskQueue.resume(id);
    res.json({ id, status: "pending" });
  });
}

module.exports = { orchestratorEndpoints };
