const { Task } = require("../models/tasks");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { reqBody, safeJsonParse } = require("../utils/http");

function taskEndpoints(app) {
  if (!app) return;

  app.post("/tasks/enqueue", [validatedRequest], async (request, response) => {
    try {
      const {
        description,
        assignedAgentId = null,
        parentTaskId = null,
        invocationId = null,
        context = null,
      } = reqBody(request);
      const task = await Task.create({
        description,
        assignedAgentId,
        parentTaskId,
        invocationId,
        context,
      });
      if (!task) throw new Error("Failed to create task");
      response.status(200).json({ success: true, task });
    } catch (e) {
      console.error(e.message);
      response.status(500).json({ success: false, error: e.message });
    }
  });

  app.patch("/tasks/:id", [validatedRequest], async (request, response) => {
    try {
      const { id } = request.params;
      const updates = reqBody(request);
      const success = await Task.update(id, updates);
      if (!success) throw new Error("Failed to update task");
      response.status(200).json({ success: true });
    } catch (e) {
      console.error(e.message);
      response.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/tasks/:id/tree", [validatedRequest], async (request, response) => {
    try {
      const { id } = request.params;
      const tree = await Task.dependencyTree(Number(id));
      response.status(200).json({ success: true, tree });
    } catch (e) {
      console.error(e.message);
      response.status(500).json({ success: false, error: e.message });
    }
  });

  app.ws("/tasks/next", async function (socket) {
    try {
      const [task] = await Task.fetchForProcessing();
      socket.send(JSON.stringify({ task }));
      socket.on("message", async (data) => {
        const payload = safeJsonParse(data);
        if (payload && payload.status && task) {
          await Task.update(task.id, { status: payload.status });
        }
      });
    } catch (e) {
      console.error(e.message);
      socket.send(JSON.stringify({ error: e.message }));
    }
  });
}

module.exports = { taskEndpoints };
