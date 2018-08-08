var Client = require('../lib');

test = new Client('consume', 'amqp://localhost');

test
  .consume(
    'hello',
    function(msg, ch) {
      console.log(msg.content.toString());
      return ch.ack(msg);
    },
    { noAck: false, prefetch: 1}
  )
  .catch(err => {
    console.log(err.message);
  });

test
  .consume(
    'hell',
    function(msg) {
      console.log(msg.content.toString());
    },
    { noAck: true }
  )
  .catch(err => {
    console.log(err.message);
  });

test
  .consume(
    'hell2',
    function(msg) {
      console.log(msg.content.toString());
    },
    { noAck: true }
  )
  .catch(err => {
    console.log(err.message);
  });

test
  .consume(
    'hell3',
    function(msg) {
      console.log(msg.content.toString());
    },
    { noAck: true }
  )
  .catch(err => {
    console.log(err.message);
  });

test
  .consume(
    'hell4',
    function(msg) {
      console.log(msg.content.toString());
    },
    { noAck: true }
  )
  .catch(err => {
    console.log(err.message);
  });
