function getAgentCard() {
  return {
    name: "AnythingLLM A2A Agent",
    description: "AnythingLLM exposes features via Google's Agent2Agent protocol.",
    url: `${process.env.PUBLIC_BASE_URL || ""}/a2a/api`,
    version: "0.1.0",
    capabilities: {
      streaming: true,
      pushNotifications: false,
    },
    defaultInputModes: ["application/json", "text/plain"],
    defaultOutputModes: ["application/json"],
    skills: [
      {
        id: "chat",
        name: "Chat",
        description: "Handle chat messages via AnythingLLM",
        tags: ["chat"],
      },
    ],
  };
}

module.exports = { getAgentCard };
