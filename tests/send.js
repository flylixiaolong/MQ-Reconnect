var Client = require('../lib');

test = Client('product', 'amqp://localhost');

var i = 1;

function send(i) {
  test
    .public('hello', 'one', i)
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
  if (i == 100000) {
    clearInterval(it);
  }
}, 0);
