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
    ],
  };
}

module.exports = { getAgentCard };
