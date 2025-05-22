let pushNotificationConfig = null;

function setPushNotificationConfig(config) {
  if (!config || typeof config.url !== 'string') return null;
  pushNotificationConfig = { url: config.url };
  return pushNotificationConfig;
}

function getPushNotificationConfig() {
  return pushNotificationConfig;
}

async function sendPushNotification(task) {
  if (!pushNotificationConfig?.url) return;
  try {
    await fetch(pushNotificationConfig.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
  } catch (e) {
    console.error('Failed to send push notification', e);
  }
}

module.exports = { setPushNotificationConfig, getPushNotificationConfig, sendPushNotification };
