var amqp = require('amqplib');
global.Promise = require('bluebird');

function Create(url, logger) {
  var conn = null;
  var channel = null;
  var url = url;
  var state = 'unconnected';
  var reconnect = null;
  var consumers = [];

  if (!logger || !typeof logger != 'function') {
    logger = console.log;
  }

  var ReConnect = function() {
    if (!reconnect) {
      reconnect = setInterval(() => {
        Connect()
          .then(ch => {
            clearInterval(reconnect);
            reconnect = null;
            Promise.each(consumers, function(item) {
              return ch.assertQueue(item.queue).then(function() {
                return ch
                  .consume(item.queue, item.handle, item.options)
                  .then(function(res) {
                    logger(url, '=>', item.queue, ': ', res);
                  })
                  .catch(function(err) {
                    logger(url, '=>', 'bind consumer error.', err.message);
                  });
              });
            });
          })
          .catch(err => {
            logger(url, '=>', 'connect failed.', err.message);
          });
      }, 1000);
    }
  };

  var Connect = function() {
    if (state === 'connected') {
      return Promise.resolve(channel);
    }
    if (state === 'connecting') {
      return Promise.delay(1000).then(function() {
        if (state === 'connected') {
          return Promise.resolve(channel);
        } else {
          return Promise.reject(new Error('conn timeout.'));
        }
      });
    }
    state = 'connecting';
    logger(url, '=>', 'waitting connect.');
    return (conn = amqp
      .connect(url)
      .then(function(_conn) {
        logger(url, '=>', 'connect success.');
        _conn.on('error', function() {
          logger(url, '=>', 'conn error.');
        });
        _conn.on('close', function() {
          state = 'unconnected';
          logger(url, '=>', 'conn close.');
          ReConnect();
        });
        return _conn;
      })
      .then(function(_conn) {
        return _conn
          .createConfirmChannel()
          .then(function(ch) {
            logger(url, '=>', 'create channel success.');
            state = 'connected';
            channel = ch;
            ch.on('error', function() {
              logger(url, '=>', 'channel error.');
            });
            ch.on('close', function() {
              logger(url, '=>', 'channel close.');
              _conn.close();
            });
            return ch;
          })
          .catch(function(err) {
            logger(url, '=>', 'create channel faild.');
            return Promise.reject(err);
          });
      })
      .catch(function(err) {
        state = 'unconnected';
        ReConnect();
        return Promise.reject(err);
      }));
  };
  return {
    SendMsg: function(queue, msg) {
      if (msg instanceof Object) {
        msg = JSON.stringify(msg);
      } else {
        msg = msg.toString();
      }
      return Connect().then(function(ch) {
        return ch
          .assertQueue(queue)
          .then(function() {
            var ok = ch.sendToQueue(queue, new Buffer(msg), {
              persistent: true
            });
            if (!ok) {
              return Promise.reject('buffer drain.');
            }
            logger(msg, 'arrived buffer.');
            return ch;
          })
          .then(function(ch) {
            logger(msg, 'wait confirm.');
            return ch.waitForConfirms();
          });
      });
    },
    PublicMsg: function(ex, key, msg) {
      if (msg instanceof Object) {
        msg = JSON.stringify(msg);
      } else {
        msg = msg.toString();
      }
      return Connect().then(function(ch) {
        return ch
          .assertExchange(ex, 'topic')
          .then(function() {
            var ok = ch.publish(ex, key, new Buffer(msg), {
              persistent: true
            });
            if (!ok) {
              return Promise.reject(new Error('buffer drain.'));
            }
            logger(msg, 'arrived buffer.');
            return ch;
          })
          .then(function(ch) {
            logger(msg, 'wait confirm.');
            return ch.waitForConfirms();
          });
      });
    },
    Consumer: function(queue, handle, options) {
      consumers.push({ queue: queue, handle: handle, options: options });
      return Connect().then(function(ch) {
        return ch.assertQueue(queue).then(function() {
          return ch.consume(queue, handle, options).then(function(res) {
            logger(url, '=>', queue, ': ', res);
            return ch;
          });
        });
      });
    }
  };
}

module.exports = Create;
