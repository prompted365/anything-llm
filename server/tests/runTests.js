const path = require('path');
const fs = require('fs');

function testA2aTasks() {
  const storePath = path.resolve(__dirname, '../storage/a2aTasks.json');
  if (fs.existsSync(storePath)) fs.unlinkSync(storePath);
  delete require.cache[require.resolve('../utils/a2aTasks')];
  const { createTask, tasks } = require('../utils/a2aTasks');
  const before = tasks.size;
  const task = createTask({ sessionId: 's1', parts: [] });
  if (tasks.size !== before + 1) throw new Error('task not added');
  const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  if (!data[task.id]) throw new Error('task not persisted');
}

function testTaskQueue() {
  const storePath = path.resolve(__dirname, '../storage/task-queue.json');
  if (fs.existsSync(storePath)) fs.unlinkSync(storePath);
  delete require.cache[require.resolve('../utils/taskQueue')];
  const { taskQueue } = require('../utils/taskQueue');
  const id = taskQueue.add({ foo: 'bar' });
  const arr = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  if (!arr.find(t => t.id === id)) throw new Error('queue not persisted');
  delete require.cache[require.resolve('../utils/taskQueue')];
  const { taskQueue: reloaded } = require('../utils/taskQueue');
  if (!reloaded.list().some(t => t.id === id)) throw new Error('queue not reloaded');
}

try {
  testA2aTasks();
  testTaskQueue();
  console.log('All tests passed');
} catch (e) {
  console.error('Test failed:', e.message);
  process.exit(1);
}
