const { taskQueue } = require('../utils/taskQueue');
const { stateMgr } = require('../utils/stateMgr');

function taskQueueEndpoint(app) {
  if (!app || !app.ws) return;

  app.ws('/task-monitor', function (socket) {
    const sendAll = () => {
      socket.send(
        JSON.stringify({ type: 'queue', tasks: taskQueue.list() })
      );
    };

    const listener = ({ taskId, status }) => {
      socket.send(
        JSON.stringify({ type: 'taskUpdate', taskId, status })
      );
    };

    stateMgr.on('stateChange', listener);
    sendAll();

    socket.on('close', () => {
      stateMgr.off('stateChange', listener);
    });
  });
}

module.exports = { taskQueueEndpoint };
