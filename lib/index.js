var amqp = require('amqplib');

/**
 * 创建MQ连接客户端
 */
function Client(name, url, interval, confirm, logger, connOptions) {
  this.name = name || Math.random().toString(36).substr(2,8).toUpperCase();
  this.url = url;
  switch (typeof interval) {
    case 'number':
      this.interval = interval;
      break;
    case 'boolean':
      this.confirm = interval;
      this.interval = 2000;
      break;
    case 'object':
      if(typeof interval.info == 'function') {
        this.logger = interval;
      }else {
        this.connOptions = interval;
      }
      this.interval = 2000;
      break;
    default:
      this.interval = 2000;
  }
  switch (typeof confirm) {
    case 'boolean':
      this.confirm = confirm;
      break;
    case 'object':
      if(typeof confirm.info == 'function') {
        this.logger = confirm;
      }else {
        this.connOptions = confirm;
      }
      this.confirm = true;
      break;
    default:
      if(typeof this.confirm != 'boolean') {
        this.confirm = true;
      }
  }
  switch (typeof logger) {
    case 'object':
      if(typeof logger.info == 'function') {
        this.logger = logger;
      }else {
        this.connOptions = logger;
        this.logger = console;
      }
      break;
    default:
      if(typeof this.logger != 'object') {
        this.logger = console;
      }
  }
  switch (typeof connOptions) {
    case 'object':
      this.connOptions = connOptions;
      break;
    default:
      if(typeof this.connOptions != 'object') {
        this.connOptions = {};
      }
  }

  this.conn = null;
  this.channel = null;
  // 连接建立的状态 connected, connecting, unconnected
  this.state = 'unconnected';
  this.consumers = [];
  this.reconnectId = null;
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
        return Promise.reject(new Error('connecting timeout'));
      }
      return client.delay().then(function(){
        return client.connect(true); 
      })
  }
  // 没有建立连接并且没有正在建立连接
  client.state = 'connecting';
  client.logger.info('[%s]:%s', client.name, 'waitting connect');
  client.conn = amqp
    .connect(client.url, client.connOptions)
    .then(function(conn){
      // 绑定事件  
      client.logger.info('[%s]:%s', client.name, 'connect success');
      conn.on('error', function(err) {
        client.logger.warn('[%s]:%s', client.name, err.message || 'connect occur error');
      });
      conn.on('close', function() {
        client.state = 'unconnected';
        client.logger.warn('[%s]:%s', client.name, 'connect closed');
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
      client.logger.info('[%s]:%s', client.name, 'create channel success');
      client.state = 'connected';
      client.channel = channel;
      channel.on('error', function(err) {
        client.logger.warn('[%s]:%s', client.name, err.message || 'channel occur error');
      });
      channel.on('close', function() {
        client.logger.warn('[%s]:%s', client.name, 'channel closed');
        channel.connection.close();
      });
      return channel;
    })
    .catch(function(err){
      client.state = 'unconnected';
      client.logger.warn('[%s]:%s', client.name, err.message || 'connect failure');
      client.reconnect();
      return Promise.reject(err);
    })
  return client.conn;
}

/**
 * 重连机制, 定时重连，连接成功绑定消费者
 */
Client.prototype.reconnect = function(){
  var client = this;
  if(client.reconnectId){
    return;
  }
  client.reconnectId = setInterval(function(){
    client
      .connect()
      .then(function(channel){
        clearInterval(client.reconnectId);
        client.reconnectId = null;
        var consumers = client.consumers;
        for(var i=0; i<consumers.length; i++){
          client.consume(
            consumers[i].queue, 
            consumers[i].handle, 
            consumers[i].options, 
            false
          );
        }
      })
      .catch(function(err){
        // client.logger.warn('[%s]:', client.name, 'connect failure');
      })
  }, client.interval);
}


Client.prototype.delay = function(){
  var client = this;
  return new Promise(function(resolve, reject){
    setTimeout(resolve, client.interval);
  })
}

/**
 * 向exchange发布消息
 */
Client.prototype.publish = function(ex, key, msg, type, exOptions, msgOptions) {
  var client = this;
  var track = [];
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
      track.push('put buffer');
      return channel;
    })
    .then(function(ch) {
      if (client.confirm) {
        track.push('wait confirm');
        return ch.waitForConfirms();
      }
      return Promise.resolve(true);
    })
    .then(function(){
      if (client.confirm) {
        track.push('server acked');
      }
      return Promise.resolve(track);
    })
    .catch(function(err){
      track.push(err.message);
      return Promise.reject(track);
    })
}

/**
 * 向Queue发布消息
 */
Client.prototype.send = function(queue, msg, quOptions, msgOptions) {
  var client = this;
  var track = [];
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
      return channel.assertQueue(queue, quOptions);
    })
    .then(function() {
      var ok = channel.sendToQueue(queue, new Buffer(msg), msgOptions);
      if (!ok) {
        return Promise.reject(new Error('buffer drain'));
      }
      track.push('put buffer');
      return channel;
    })
    .then(function(ch) {
      if (client.confirm) {
        track.push('wait confirm');
        return ch.waitForConfirms();
      }
      return Promise.resolve(true);
    })
    .then(function(){
      if (client.confirm) {
        track.push('server acked');
      }
      return Promise.resolve(track);
    })
    .catch(function(err){
      track.push(err.message);
      return Promise.reject(track);
    })
}

Client.prototype.consume = function(queue, handle, options, reconnect) {
  var client = this;
  if(reconnect===undefined || reconnect===null){
    reconnect = true;
  }
  if (reconnect){
    client.consumers.push({
      queue: queue, 
      handle: handle, 
      options: options
    });
  }
  var args = JSON.stringify({
    queue: queue, 
    handle: handle.name 
  });
  var channel = null;
  return client.connect()
    .then(function(ch) {
      channel = ch;
      if(options.prefetch){
        return channel.prefetch(options.prefetch);
      }
      return channel;
    })
    .then(function(ch) {
      return channel.assertQueue(queue);
    })
    .then(function(){
      return channel.consume(queue, function(msg){
        handle(msg, channel);
      }, options);
    })
    .then(function(res){
      res = JSON.stringify(res);
      client.logger.info('[%s]:%s,%s,%s', client.name, args, 'bind consume success', res);
    })
    .catch(function(err){
      client.logger.warn('[%s]:%s,%s', client.name, args, err.message || 'bind consume error');
    });
}

module.exports = Client;
