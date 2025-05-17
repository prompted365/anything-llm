const { Task } = require("../models/tasks.js");
const { log, conclude } = require("./helpers/index.js");

(async () => {
  try {
    const tasks = await Task.fetchForProcessing();
    if (tasks.length === 0) {
      log("No tasks to process");
      conclude();
      return;
    }

    for (const task of tasks) {
      log(`Processing task ${task.id}`);
      // TODO: actual task execution logic
      await Task.update(task.id, { status: Task.statuses.completed });
    }
    conclude();
  } catch (e) {
    console.error(e);
    conclude();
  }
})();
