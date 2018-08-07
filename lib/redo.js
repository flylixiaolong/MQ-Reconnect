var amqp = require('amqplib');

/**
 * 创建MQ连接客户端
 */
function Client(url, interval, confirm, logger, connOptions) {
  this.url = url;
  switch (typeof(interval)) {
    case 'number':
      this.interval = interval;
      break;
    case 'boolean':
      this.confirm = confirm;
      this.interval = 2000;
      break;
    case 'function':
      this.logger = logger;
      this.confirm=true;
      this.interval = 2000;
      break;
    case 'object':
      this.connOptions = connOptions;
      this.confirm=true;
      this.interval = 2000;
      break;
    default:
      this.interval = 2000;
  }
  switch (typeof(confirm)) {
    case 'boolean':
      this.confirm = confirm;
      break;
    case 'function':
      this.logger = logger;
      this.confirm=true;
      break;
    case 'object':
      this.connOptions = connOptions;
      this.confirm=true;
      break;
    default:
      this.confirm=true;
  }
  switch (typeof(logger)) {
    case 'function':
      this.logger = logger;
      break;
    case 'object':
      this.connOptions = connOptions;
      this.logger = console.log;
      break;
    default:
      this.logger = console.log;
  }
  switch (typeof(connOptions)) {
    case 'object':
      this.connOptions = connOptions;
      break;
    default:
      this.connOptions = {};
  }

  this.conn = null;
  this.channel = null;
  // 连接建立的状态 connected, connecting, unconnected
  this.state = 'unconnected';
}

/**
 * 建立连接
 */
Client.prototype.connect = function(immediate){
  var client = this;
  switch(client.state) {
    case 'connected':
      return Promise.resolve(client.channel);
    case 'connecting':
      if(immediate) {
        return Promise.reject('connecting timeout');
      }
      return client.delay().then(function(){
        return client.connect(true); 
      })
  }
  // 没有建立连接并且没有正在建立连接
  client.state = 'connecting';
  client.logger(client.url, '=>', 'waitting connecting');
  client.conn = amqp
    .connect(client.url, client.connOptions)
    .then(function(conn){
      // 绑定事件  
      client.logger(client.url, '=>', 'connect success');
      conn.on('error', function() {
        client.logger(client.url, '=>', 'connect error');
      });
      conn.on('close', function() {
        client.state = 'unconnected';
        client.logger(client.url, '=>', 'connect closed');
        client.reconnect();
      });
      return conn;
    })
    .then(function(conn){
      // 建立通道ture为可靠信道
      if(client.confirm) {
        return conn.createConfirmChannel();
      }
      return conn.createChannel();
    })
    .then(function(channel){
      client.logger(client.url, '=>', 'create channel success');
      client.state = 'connected';
      client.channel = channel;
      channel.on('error', function() {
        client.logger(client.url, '=>', 'channel error');
      });
      channel.on('close', function() {
        client.logger(client.url, '=>', 'channel close');
        channel.connection.close();
      });
      return channel;
    })
  return client.conn;
}

/**
 * 重连机制, 定时重连，连接成功绑定消费者
 */
Client.prototype.reconnect = function(){
  var client = this;
  setInterval(function(){
    client.connect().then(function(channel){

    })
  }, client.interval);
}


Client.prototype.delay = function(){
  var client = this;
  return new Promise(function(resolve, reject){
    setTimeout(resolve, client.interval);
  })
}

Client.prototype.publish = function(ex, key, msg, type, exOptions, msgOptions) {
  var client = this;
  if (msg instanceof Object) {
    msg = JSON.stringify(msg);
  } else {
    msg = msg.toString();
  }
  var channel = null;
  return client
    .connect()
    .then(function(ch){
      channel = ch;
      return channel.assertExchange(ex, type, exOptions);
    })
    .then(function() {
      var ok = channel.publish(ex, key, new Buffer(msg), msgOptions);
      if (!ok) {
        return Promise.reject(new Error('buffer drain'));
      }
      client.logger(msg, 'arrived buffer');
      return channel;
    })
    .then(function(ch){
      client.logger(msg, 'wait for confirm');
      return ch.waitForConfirms();
    })
}

test = new Client('amqp://localhost');

var i = 1;

function send(i) {
  test
    .publish('hello', 'one', i, 'topic')
    .then(info => {
      console.log(i, 'ok');
    })
    .catch(err => {
      console.log(i, 'no', err.message);
    });
}

it = setInterval(() => {
  send(i);
  i += 1;
  if (i == 100000) {
    clearInterval(it);
  }
}, 0);

