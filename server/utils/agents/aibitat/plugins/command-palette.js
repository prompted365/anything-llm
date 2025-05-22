const commandPalette = {
  name: "command-palette",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: this.name,
      setup(aibitat) {
        aibitat.commandPalette = {
          /**
           * List all available functions registered on the agent instance.
           * @returns {Array<{name: string, description: string}>}
           */
          listCommands: function () {
            return Array.from(aibitat.functions.values()).map((fn) => ({
              name: fn.name,
              description: fn.description || "",
            }));
          },
          /**
           * Execute a function by name with optional arguments.
           * @param {string} name - The name of the command to execute
           * @param {Object} args - Arguments to pass to the command
           * @returns {Promise<any>} - Result of the command execution
           */
          execute: async function (name, args = {}) {
            const fn = aibitat.functions.get(name);
            if (!fn) throw new Error(`Command ${name} not found`);
            fn.caller = "command-palette";
            return await fn.handler.call(fn, args);
          },
        };
      },
    };
  },
};

module.exports = { commandPalette };
