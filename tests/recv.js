var Client = require('../lib');

test = new Client('consume', 'amqp://localhost');

test
  .consume(
    'hello',
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
