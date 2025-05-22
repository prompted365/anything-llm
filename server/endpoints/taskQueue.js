const { taskQueue } = require('../utils/taskQueue');
const { stateMgr } = require('../utils/stateMgr');

function taskQueueEndpoint(app) {
  if (!app || !app.ws) return;

  app.post('/tasks/:id/await-human', (req, res) => {
    const { id } = req.params;
    taskQueue.awaitHuman(id);
    res.json({ id, status: 'awaiting-human' });
  });

  app.post('/tasks/:id/resume', (req, res) => {
    const { id } = req.params;
    taskQueue.resume(id);
    res.json({ id, status: 'pending' });
  });

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
