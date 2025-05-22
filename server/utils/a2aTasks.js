const { v4: uuidv4 } = require('uuid');

const tasks = new Map();

function createTask(message) {
  const id = uuidv4();
  const contextId = message.contextId || uuidv4();
  const task = {
    id,
    contextId,
    status: { state: 'completed' },
    artifacts: [],
    history: [message],
    metadata: {},
  };
  tasks.set(id, task);
  return task;
}

function getTask(id) {
  return tasks.get(id) || null;
}

function cancelTask(id) {
  const task = tasks.get(id);
  if (!task) return null;
  if (!['completed','canceled','failed','rejected'].includes(task.status.state)) {
    task.status.state = 'canceled';
  }
  return task;
}

module.exports = { createTask, getTask, cancelTask };
