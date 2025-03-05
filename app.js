const mqttPlugin = require('./lib/mqtt')

module.exports = app => {
  mqttPlugin(app)
}
