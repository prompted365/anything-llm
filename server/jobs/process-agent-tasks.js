const { AgentHandler } = require('../utils/agents');
const { taskQueue } = require('../utils/taskQueue');
const { stateMgr } = require('../utils/stateMgr');
const { log, conclude } = require('./helpers/index.js');

(async () => {
  try {
    const task = taskQueue.next();
    if (!task) {
      log('No queued agent tasks.');
      return;
    }

    log(`Starting agent task ${task.id}`);
    try {
      const agentHandler = await new AgentHandler({ uuid: task.payload.uuid }).init();
      if (!agentHandler.invocation) {
        log(`Invalid invocation for task ${task.id}`);
        taskQueue.complete(task.id, 'failed');
        return;
      }

      await agentHandler.createAIbitat({ socket: task.payload.socket });
      await agentHandler.startAgentCluster();
      taskQueue.complete(task.id, 'completed');
      log(`Completed agent task ${task.id}`);
    } catch (err) {
      console.error(err);
      taskQueue.complete(task.id, 'failed');
    }
  } catch (e) {
    console.error(e);
  } finally {
    conclude();
  }
})();
