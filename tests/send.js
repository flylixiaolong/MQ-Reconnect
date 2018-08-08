var Client = require('../lib');

test = new Client('product', 'amqp://localhost', 200);

var i = 1;

function send(i) {
  test
    .send('hello', i, {prefetch: 1})
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
  if (i == 50) {
    clearInterval(it);
  }
}, 0);
