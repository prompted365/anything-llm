const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const { sendPushNotification } = require("./a2aPushNotifications");
const bus = require("./eventBus");

const PERSIST_PATH = path.resolve(__dirname, "../storage/a2aTasks.json");

function loadPersistedTasks() {
  try {
    if (!fs.existsSync(PERSIST_PATH)) return new Map();
    const raw = fs.readFileSync(PERSIST_PATH, "utf8");
    const data = JSON.parse(raw);
    const map = new Map();
    for (const [k, v] of Object.entries(data)) {
      map.set(k, v);
    }
    return map;
  } catch (e) {
    console.error("Failed to load persisted A2A tasks", e);
    return new Map();
  }
}

function persistTasks(map) {
  try {
    const obj = {};
    for (const [k, v] of map.entries()) obj[k] = v;
    fs.mkdirSync(path.dirname(PERSIST_PATH), { recursive: true });
    fs.writeFileSync(PERSIST_PATH, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.error("Failed to persist A2A tasks", e);
  }
}

const tasks = loadPersistedTasks();

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
  persistTasks(tasks);
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
  persistTasks(tasks);
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
  persistTasks(tasks);
  return task;
}

function requestHumanInput(id, msgParts = []) {
  const task = tasks.get(id);
  if (!task) return null;
  setStatus(task, 'input-required', msgParts);
  persistTasks(tasks);
  return task;
}

module.exports = { createTask, getTask, cancelTask, requestHumanInput, setStatus, tasks };
