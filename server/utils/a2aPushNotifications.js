const pushConfigs = new Map();

function setPushNotificationConfig(taskId, cfg) {
  if (!(cfg?.url)) return null;
  pushConfigs.set(taskId, cfg);
  return cfg;
}

function getPushNotificationConfig(taskId) {
  return pushConfigs.get(taskId) || null;
}

async function sendPushNotification(task) {
  const cfg = pushConfigs.get(task.id);
  if (!cfg?.url) return;
  try {
    await fetch(cfg.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.token ? { 'X-A2A-Notification-Token': cfg.token } : {}),
      },
      body: JSON.stringify(task),
    });
  } catch (e) {
    console.error('Failed to send push notification', e);
  }
}

module.exports = { setPushNotificationConfig, getPushNotificationConfig, sendPushNotification };
