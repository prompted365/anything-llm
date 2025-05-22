function getAgentCard() {
  return {
    name: "AnythingLLM A2A Agent",
    description: "AnythingLLM exposes features via Google's Agent2Agent protocol.",
    url: `${process.env.PUBLIC_BASE_URL || ""}/a2a/api`,
    version: "0.1.0",
    capabilities: { streaming: true, pushNotifications: true, stateTransitionHistory: false },
    defaultInputModes: ["application/json", "text/plain"],
    defaultOutputModes: ["application/json"],
    skills: [
      {
        id: "chat",
        name: "Conversational + Data API",
        description: "Free-form chat. Supports multi-turn input, structured JSON replies, file analysis and webhook notifications.",
        tags: ["chat", "json", "file", "multiturn"],
      },
      {
        id: "task-management",
        name: "Task Queue Control",
        description: "Pause and resume queued tasks for human review.",
        tags: ["tasks", "pause", "resume"],
      },
    ],
    metadata: { repository: "https://github.com/Mintplex-Labs/anything-llm" },
  };
}

module.exports = { getAgentCard };
