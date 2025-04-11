module.exports = agent => {
  //   const workers = process.env.EGG_WORKERS || 1;
  const mqttConfig = agent.config.mqtt.client;
  const mqttClientMap = {};
  let count = 0;

  agent.messenger.on('egg-ready', () => {
    agent.logger.info('[eyu-egg-mqtt] egg-ready:agent');
    agent.messenger.sendToApp('eyuEggMqtt-agent-ready');
  });
  agent.messenger.on('eyuEggMqtt-worker-ready', pid => {
    if (!mqttConfig || !mqttConfig.clientIdPrefix) return;
    agent.logger.info('[eyu-egg-mqtt] agent received worker-ready', pid, ++count);
    mqttClientMap[pid] = `${mqttConfig.clientIdPrefix}${count}`;
    agent.messenger.sendTo(pid, 'eyuEggMqtt-alloc-clientid', mqttClientMap[pid]);
  });
};
