const { v4: uuidv4 } = require('uuid');
const { sendPushNotification } = require('./a2aPushNotifications');
const bus = require('./eventBus');

const tasks = new Map();

function setStatus(task, state, msgPartArray = []) {
  task.status = {
    state,
    message: msgPartArray.length
      ? { role: 'agent', parts: msgPartArray, messageId: uuidv4(), taskId: task.id, contextId: task.contextId }
      : undefined,
    timestamp: new Date().toISOString(),
  };
  sendPushNotification(task);
  bus.emit(`task:${task.id}`, { taskId: task.id, event: 'status', payload: task.status });
}

function createTask(message, metadata = {}) {
  const id = uuidv4();
  const contextId = message.contextId || uuidv4();
  const task = {
    id,
    contextId,
    status: { state: 'submitted', timestamp: new Date().toISOString(), message: null },
    sessionId: message.sessionId,
    pushConfig: null,
    artifacts: [],
    history: [message],
    metadata,
  };
  tasks.set(id, task);
  sendPushNotification(task);
  return task;
}

function getTask(id) {
  return tasks.get(id) || null;
}

function cancelTask(id) {
  const task = tasks.get(id);
  if (!task) return null;
  if (!['completed', 'canceled', 'failed', 'rejected'].includes(task.status.state)) {
    setStatus(task, 'canceled');
  }
  return task;
}

function requestHumanInput(id, msgParts = []) {
  const task = tasks.get(id);
  if (!task) return null;
  setStatus(task, 'input-required', msgParts);
  return task;
}

module.exports = { createTask, getTask, cancelTask, requestHumanInput, setStatus, tasks };
