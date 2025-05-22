const prisma = require("../utils/prisma");
const { BackgroundService } = require("../utils/BackgroundWorkers");

const Task = {
  statuses: {
    queued: "queued",
    running: "running",
    completed: "completed",
    failed: "failed",
  },

  bootWorkers: function () {
    new BackgroundService().boot();
  },

  killWorkers: function () {
    new BackgroundService().stop();
  },

  create: async function ({
    description,
    assignedAgentId = null,
    parentTaskId = null,
    invocationId = null,
    context = null,
  } = {}) {
    try {
      const task = await prisma.tasks.create({
        data: {
          description: String(description),
          assignedAgentId: assignedAgentId !== undefined ? assignedAgentId : null,
          parentTaskId: parentTaskId !== undefined ? parentTaskId : null,
          invocationId: invocationId !== undefined ? invocationId : null,
          context: context ? JSON.stringify(context) : null,
        },
      });
      return task || null;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  },

  update: async function (id = null, data = {}) {
    if (!id) return false;
    try {
      const { context, ...rest } = data;
      await prisma.tasks.update({
        where: { id: Number(id) },
        data: {
          ...rest,
          ...(context !== undefined ? { context: JSON.stringify(context) } : {}),
        },
      });
      return true;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  },

  get: async function (clause = {}) {
    try {
      const task = await prisma.tasks.findFirst({ where: clause });
      return task || null;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  },

  where: async function (clause = {}, limit = null, orderBy = null) {
    try {
      const results = await prisma.tasks.findMany({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
        ...(orderBy !== null ? { orderBy } : {}),
      });
      return results;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  delete: async function (clause = {}) {
    try {
      await prisma.tasks.deleteMany({ where: clause });
      return true;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  },

  count: async function (clause = {}) {
    try {
      const count = await prisma.tasks.count({ where: clause });
      return count;
    } catch (error) {
      console.error(error.message);
      return 0;
    }
  },

  fetchForProcessing: async function (limit = 1) {
    return await prisma.$transaction(async (tx) => {
      const tasks = await tx.tasks.findMany({
        where: { status: this.statuses.queued },
        take: limit,
        orderBy: { id: "asc" },
      });
      if (tasks.length === 0) return [];
      const ids = tasks.map((t) => t.id);
      await tx.tasks.updateMany({
        where: { id: { in: ids } },
        data: { status: this.statuses.running },
      });
      return tasks.map((t) => ({ ...t, status: this.statuses.running }));
    });
  },

  dependencyTree: async function (taskId = null) {
    if (!taskId) return null;
    const build = async (id) => {
      const task = await this.get({ id });
      if (!task) return null;
      const children = await this.where({ parentTaskId: id });
      const childrenTrees = [];
      for (const child of children) {
        childrenTrees.push(await build(child.id));
      }
      return { ...task, children: childrenTrees };
    };
    return await build(taskId);
  },
};

module.exports = { Task };
