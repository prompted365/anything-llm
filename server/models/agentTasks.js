const prisma = require("../utils/prisma");

const AgentTasks = {
  new: async function ({ invocationId, parentId = null, context = {} }) {
    try {
      const task = await prisma.agent_tasks.create({
        data: {
          invocation_id: invocationId,
          parent_id: parentId,
          context: JSON.stringify(context),
        },
      });
      return { task, message: null };
    } catch (error) {
      console.error(error.message);
      return { task: null, message: error.message };
    }
  },

  get: async function (clause = {}) {
    try {
      const task = await prisma.agent_tasks.findFirst({ where: clause });
      return task || null;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  },

  update: async function (id, data = {}) {
    if (!id) return null;
    const updateData = { ...data };
    if (Object.prototype.hasOwnProperty.call(updateData, "context")) {
      updateData.context = JSON.stringify(updateData.context);
    }
    try {
      const task = await prisma.agent_tasks.update({
        where: { id },
        data: updateData,
      });
      return task;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  },

  children: async function (parentId) {
    if (!parentId) return [];
    try {
      return await prisma.agent_tasks.findMany({
        where: { parent_id: parentId },
      });
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },
};

module.exports = { AgentTasks };
