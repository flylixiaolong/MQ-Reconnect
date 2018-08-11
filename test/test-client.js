const assert = require('assert');
const Client = require('../lib');

describe('Test Client', () => {
  it('setting name and url', () => {
    var client = new Client();
    assert.notEqual(client.name, null, 'default name error');
    assert.equal(client.url, 'amqp://localhost', 'default url error');
    client = new Client('consume', 'amqp://127.0.0.1', false);
    assert.equal(client.url, 'amqp://127.0.0.1', 'setting url error');
    assert.equal(client.name, 'consume', 'setting name error');
  })

  it('setting reconnect interval', () => {
    var client = new Client();
    assert.equal(client.interval, 2000, 'default interval error');
    client = new Client(null, null, false);
    assert.equal(client.interval, 2000, 'default interval error');
    client = new Client(null, null, 1000, console);
    assert.equal(client.interval, 1000, 'default interval error');
    client = new Client(null, null, false, console, {noDelay: true});
    assert.equal(client.interval, 2000, 'default interval error');
  })

  it('seting logging object', () => {
    var client = new Client();
    assert.equal(client.logger, console, 'default logger error');
    client = new Client(false);
    assert.equal(client.logger, console, 'default logger error');
    var logger = {info: ()=>{console.log()}}
    client = new Client(null, null, 1000, false, logger);
    assert.equal(client.logger, logger, 'setting logger error');
    client = new Client(false, {noDelay: true});
    assert.equal(client.logger, console, 'default logger error');
  })

  it('seting socketOptions object', () => {
    var options = {noDelay: true}
    var client = new Client(null, null, false, options);
    assert.equal(client.socketOptions, options, 'setting socketOptions error');
  })
})
