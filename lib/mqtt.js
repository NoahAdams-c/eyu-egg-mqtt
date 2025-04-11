const mqtt = require('mqtt')

const SUB_GROUP_ID = 'EYU_EGG_MQTT'

const registRoute = (app, topic, handler) => {
  if (!topic) return null
  const matchKeys = topic.match(/\:(\w+)/g)
  const newTopic = topic.replace(/\:(\w+)/g, '+')
  if (!app.mqttRoutes) app.mqttRoutes = {}
  app.mqttRoutes[newTopic] = {
    func: handler,
    paramKeys: matchKeys ? matchKeys.map(item => item.slice(1)) : []
  }
  // 使用共享订阅确保多worker情况下只有其中一个worker进行消费
  app.mqtt.subscribe(`$share/${SUB_GROUP_ID}/${newTopic}`)
}

const messageHandler = (app, topic, payload) => {
  app.logger.info(
    '[eyu-egg-mqtt] MQTT client received: %s, payload: %s',
    topic,
    payload.toString()
  )
  const routePaths = Object.keys(app.mqttRoutes)
  routePaths.forEach(routePath => {
    const matchRegExp = RegExp(routePath.replace(/\+/g, '(\\S+)'))
    const matchRes = topic.match(matchRegExp)
    if (matchRes) {
      const { func: handler, paramKeys } = app.mqttRoutes[routePath]
      const paramValues = matchRes.slice(1)
      const params = {}
      paramKeys.forEach((paramKey, index) => {
        params[paramKey] = paramValues[index]
      })
      const ctx = app.createAnonymousContext()
      ctx.method = 'sub'
      ctx.url = topic
      ctx.params = params
      ctx.request.body = JSON.parse(payload.toString())
      handler.call(ctx).catch(e => {
        e.message = '[eyu-egg-mqtt] controller execute error: ' + e.message
        app.coreLogger.error(e)
      })
    }
  })
}

module.exports = app => {
  app.addSingleton('mqtt', createMQTTClinet)
}

function createMQTTClinet(config, app) {
  let client
  app.logger.info('[eyu-egg-mqtt] MQTT client init begin.')
  if (!config) {
    app.logger.error(
      '[eyu-egg-mqtt]',
      'Failed to create MQTT client: config is null.'
    )
    return null
  }
  if(config.clientIdPrefix) {
    app.messenger.on('eyuEggMqtt-agent-ready', () => {
      app.logger.info("[eyu-egg-mqtt] worker %s received agent-ready", process.pid)
      app.messenger.sendToAgent('eyuEggMqtt-worker-ready', process.pid)
    })
    app.messenger.on("eyuEggMqtt-alloc-clientid",(clientId) => {
      app.logger.info("[eyu-egg-mqtt] worker %s alloc clientId: %s", process.pid, clientId)
      config.clientId = clientId
    })
  }
  try {
    // Create client and handle connection events
    if (config.wssUrl) {
      client = mqtt.connect(config.wssUrl, {
        username: config.username,
        password: config.password,
        clientId: config.clientId
      })
    } else {
      client = mqtt.connect(config)
    }
    // Handle connect event
    client.on('connect', () => {
      app.logger.info(
        `[eyu-egg-mqtt] MQTT client(${config.clientId}) is connected.`
      )
    })
    // Handle disconnect event
    client.on('disconnect', () => {
      app.logger.warn(
        '[eyu-egg-mqtt] MQTT client disconnected. Attempting to reconnect...'
      )
    })
    // Reconnect logic
    client.on('reconnect', (attempt, duration) => {
      app.logger.warn(
        '[eyu-egg-mqtt] Reconnecting to MQTT Broker... attempt: %s, duration: %sms',
        attempt,
        duration
      )
    })
    // Handle offline event
    client.on('offline', () => {
      app.logger.warn('[eyu-egg-mqtt] MQTT client is offline.')
    })
    // Handle message event
    client.on('message', (topic, payload) => {
      messageHandler(app, topic, payload)
    })
    client.route = (topic, controller) => registRoute(app, topic, controller)
    client.pub = (topic, message) => {
      app.logger.info(
        '[eyu-egg-mqtt] MQTT client publish: %s, payload: %s',
        topic,
        message
      )
      return client.publishAsync(topic, message)
    }
    return client
  } catch (error) {
    app.logger.error('[eyu-egg-mqtt]', 'Failed to create MQTT client:', error)
    throw error
  }
}
