const { v4: uuidv4 } = require('uuid');
const { stateMgr } = require('../stateMgr');

class TaskQueue {
  constructor() {
    if (TaskQueue.instance) return TaskQueue.instance;
    this.tasks = [];
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
    }
  }

  freeze(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'frozen';
      task.locked = false;
      stateMgr.set(task.id, 'frozen');
    }
  }

  unfreeze(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && task.status === 'frozen') {
      task.status = 'pending';
      stateMgr.set(task.id, 'pending');
    }
  }

  awaitHuman(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'awaiting-human';
      task.locked = false;
      stateMgr.set(task.id, 'awaiting-human');
    }
  }

  resume(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && task.status === 'awaiting-human') {
      task.status = 'pending';
      stateMgr.set(task.id, 'pending');
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
