const fs = require('fs');
const path = require('path');
const { safeJsonParse } = require('../http');
const { taskQueue } = require('../taskQueue');

class AgentOrchestrator {
  constructor({ project = null } = {}) {
    this.project = project;
    this.globalConfigPath = AgentOrchestrator.globalConfigPath();
    this.projectConfigPath = project
      ? AgentOrchestrator.projectConfigPath(project)
      : null;
    this.modes = this.#loadModes();
  }

  static baseStorage() {
    return process.env.NODE_ENV === 'development'
      ? path.resolve(__dirname, '../../storage')
      : path.resolve(process.env.STORAGE_DIR ?? path.resolve(__dirname, '../../storage'));
  }

  static globalConfigPath() {
    return path.join(this.baseStorage(), 'orchestrator', 'global.modes.json');
  }

  static projectConfigPath(project) {
    return path.join(this.baseStorage(), 'orchestrator', `project-${project}.modes.json`);
  }

  static #ensureFile(filePath) {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify({ customModes: [] }, null, 2), 'utf8');
    }
  }

  #loadFile(filePath) {
    AgentOrchestrator.#ensureFile(filePath);
    return safeJsonParse(fs.readFileSync(filePath, 'utf8'), { customModes: [] });
  }

  #loadModes() {
    const globalCfg = this.#loadFile(this.globalConfigPath);
    const projectCfg = this.projectConfigPath ? this.#loadFile(this.projectConfigPath) : { customModes: [] };
    return [...globalCfg.customModes, ...projectCfg.customModes];
  }

  listModes() {
    return this.modes;
  }

  mode(slug) {
    return this.modes.find((m) => m.slug === slug) || null;
  }

  /**
   * Delegate a payload to the task queue with the provided mode slug.
   * The returned task id can be monitored via /task-monitor websocket.
   *
   * @param {string} slug - Mode slug to delegate the task to.
   * @param {object} payload - Arbitrary payload for the task.
   * @param {object} options - TaskQueue options like priority, group, cluster, runAt.
   * @returns {string} task id
   */
  delegate(slug, payload = {}, options = {}) {
    const mode = this.mode(slug);
    if (!mode) throw new Error(`Unknown mode slug: ${slug}`);
    const id = taskQueue.add({ ...payload, mode: slug }, { ...options, group: slug });
    if (mode.requiresHuman) {
      taskQueue.awaitHuman(id);
    }
    return id;
  }
}

module.exports = { AgentOrchestrator };
