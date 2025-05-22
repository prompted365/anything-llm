const { v4: uuidv4 } = require("uuid");
const { stateMgr } = require("../stateMgr");
const fs = require("fs");
const path = require("path");

const PERSIST_PATH = path.resolve(__dirname, "../../storage/task-queue.json");

function loadPersisted() {
  try {
    if (!fs.existsSync(PERSIST_PATH)) return [];
    const raw = fs.readFileSync(PERSIST_PATH, "utf8");
    const arr = JSON.parse(raw);
    return arr.map((t) => ({ ...t, runAt: new Date(t.runAt) }));
  } catch (e) {
    console.error("Failed to load persisted task queue", e);
    return [];
  }
}

function persist(arr) {
  try {
    fs.mkdirSync(path.dirname(PERSIST_PATH), { recursive: true });
    fs.writeFileSync(
      PERSIST_PATH,
      JSON.stringify(arr.map((t) => ({ ...t, runAt: t.runAt.toISOString() }))),
      "utf8"
    );
  } catch (e) {
    console.error("Failed to persist task queue", e);
  }
}

class TaskQueue {
  constructor() {
    if (TaskQueue.instance) return TaskQueue.instance;
    this.tasks = loadPersisted();
    TaskQueue.instance = this;
  }

  add(payload = {}, {
    priority = 0,
    group = null,
    cluster = null,
    runAt = new Date(),
  } = {}) {
    const task = {
      id: uuidv4(),
      payload,
      priority,
      group,
      cluster,
      runAt: new Date(runAt),
      status: 'pending',
      locked: false,
    };
    this.tasks.push(task);
    this.sort();
    stateMgr.set(task.id, 'pending');
    persist(this.tasks);
    return task.id;
  }

  sort() {
    this.tasks.sort((a, b) => {
      if (a.runAt.getTime() === b.runAt.getTime()) {
        return b.priority - a.priority;
      }
      return a.runAt - b.runAt;
    });
  }

  next() {
    const now = Date.now();
    for (const task of this.tasks) {
      if (task.status !== 'pending') continue;
      if (task.runAt.getTime() > now) continue;
      if (task.locked) continue;
      task.locked = true;
      task.status = 'processing';
      stateMgr.set(task.id, 'processing');
      return task;
    }
    return null;
  }

  complete(taskId, status = 'completed') {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      task.locked = false;
      stateMgr.set(task.id, status);
      if (['completed', 'failed'].includes(status)) {
        // remove finished tasks
        this.tasks = this.tasks.filter(t => t.id !== taskId);
      }
      persist(this.tasks);
    }
  }

  freeze(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'frozen';
      task.locked = false;
      stateMgr.set(task.id, 'frozen');
      persist(this.tasks);
    }
  }

  unfreeze(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && task.status === 'frozen') {
      task.status = 'pending';
      stateMgr.set(task.id, 'pending');
      persist(this.tasks);
    }
  }

  awaitHuman(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'awaiting-human';
      task.locked = false;
      stateMgr.set(task.id, 'awaiting-human');
      persist(this.tasks);
    }
  }

  resume(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && task.status === 'awaiting-human') {
      task.status = 'pending';
      stateMgr.set(task.id, 'pending');
      persist(this.tasks);
    }
  }

  list() {
    return this.tasks.map(t => ({
      id: t.id,
      status: t.status,
      priority: t.priority,
      group: t.group,
      cluster: t.cluster,
      runAt: t.runAt,
    }));
  }
}

module.exports = { taskQueue: new TaskQueue() };
