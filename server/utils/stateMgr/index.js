const { EventEmitter } = require('events');

class StateManager extends EventEmitter {
  constructor() {
    super();
    if (StateManager.instance) return StateManager.instance;
    this.state = {};
    StateManager.instance = this;
  }

  set(taskId, status) {
    this.state[taskId] = status;
    this.emit('stateChange', { taskId, status });
  }

  get(taskId) {
    return this.state[taskId];
  }

  all() {
    return this.state;
  }
}

module.exports = { stateMgr: new StateManager() };
