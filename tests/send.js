var Create = require('../lib');

test = Create('amqp://localhost');

var i = 1;

function send(i) {
  test
    .PublicMsg('hello', 'one', i)
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
