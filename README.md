# eyu-egg-dubbo

[![NPM version][npm-image]][npm-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/eyu-egg-mqtt.svg?style=flat-square
[npm-url]: https://npmjs.org/package/eyu-egg-mqtt
[download-image]: https://img.shields.io/npm/dm/eyu-egg-mqtt.svg?style=flat-square
[download-url]: https://npmjs.org/package/eyu-egg-mqtt

<!--
Description here.
-->

## Install

```bash
$ npm i eyu-egg-mqtt --save
```

## Usage

Register with the plugin list

```js
// {app_root}/config/plugin.js
exports.eyuEggMQTT = {
  enable: true,
  package: 'eyu-egg-mqtt',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.mqtt = {
  client: {
    wssUrl: 'wss://xxx.xxx/'
    host: 'xxx.xxx.xxx.xxx',
    port: 1883,
    username: 'xxx',
    password: 'xxxxxxx',
    clientIdPrefix: '',
    keepalive: 60,
    cleanup: true
  }
};
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

Configuring routes

```js
// app/route.js
module.exports = app => {
  const { mqtt, router, controller } = app;
  router.get('/', controller.home.index);

  // subscribe topic
  mqtt.route('/topic/:uuid/sub', controller.mqtt.test);
};
```

Handler/Controller

```js
// app/controller/mqtt
const { Controller } = require('egg');

class MQTTController extends Controller {
  async test() {
    const { app, ctx } = this;
    // params in topics
    const { uuid } = ctx.params
    // json payload
    const { foo, bar } = ctx.request.body
    // publish message
    await app.pub('pub_topic', JSON.stringify({
      foo: 1,
      bar: 0
    }))
  }
}

module.exports = MQTTController
```

## Questions & Suggestions

Please open an issue [here](https://github.com/NoahAdams-c/eyu-egg-mqtt/issues).

## License

[MIT](LICENSE)
