const pluralize = require("pluralize");
const { WorkspaceAgentInvocation } = require("../../models/workspaceAgentInvocation");
const { writeResponseChunk } = require("../helpers/chat/responses");
const { taskQueue } = require("../taskQueue");

async function grepAgents({
  uuid,
  response,
  message,
  workspace,
  user = null,
  thread = null,
}) {
  const agentHandles = WorkspaceAgentInvocation.parseAgents(message);
  if (agentHandles.length > 0) {
    const { invocation: newInvocation } = await WorkspaceAgentInvocation.new({
      prompt: message,
      workspace: workspace,
      user: user,
      thread: thread,
    });

    if (!newInvocation) {
      writeResponseChunk(response, {
        id: uuid,
        type: "statusResponse",
        textResponse: `${pluralize(
          "Agent",
          agentHandles.length
        )} ${agentHandles.join(
          ", "
        )} could not be called. Chat will be handled as default chat.`,
        sources: [],
        close: true,
        animate: false,
        error: null,
      });
      return;
    }

    const taskId = taskQueue.add({ uuid: newInvocation.uuid });

    writeResponseChunk(response, {
      id: uuid,
      type: "statusResponse",
      textResponse: `${pluralize(
        "Agent",
        agentHandles.length
      )} ${agentHandles.join(
        ", "
      )} queued with task id ${taskId}. Monitor via /task-monitor websocket.`,
      sources: [],
      close: true,
      error: null,
      animate: true,
    });
    return true;
  }

  return false;
}

module.exports = { grepAgents };
