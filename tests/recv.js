var Create = require('../lib');

test = Create('amqp://localhost');

test
  .Consumer(
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
  .Consumer(
    'hell',
    function(msg) {
      console.log(msg.content.toString());
    },
    { noAck: true }
  )
  .catch(err => {
    console.log(err.message);
  });
