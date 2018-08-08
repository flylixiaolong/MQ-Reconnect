var Client = require('../lib');

test = new Client('product', 'amqp://localhost');

var i = 1;

function send(i) {
  test
    .publish('hello', 'one', i, 'topic')
    .then(info => {
      console.log(i, 'ok');
    })
    .catch(err => {
      console.log(i, 'no');
    });
}

it = setInterval(() => {
  send(i);
  i += 1;
  if (i == 5000) {
    clearInterval(it);
  }
}, 0);
