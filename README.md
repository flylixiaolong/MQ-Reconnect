## MQ-Reconnect

This package is one simple wrapper for [amqplib](http://www.squaremobius.net/amqp.node/).

    npm install mq-reconnect


### Document

MQ-Reconnect is the wrapper for amqplib. It makes send or publish message simple, and using persistent connection, suporting  reconnect to server when connection closed.

##### Client

create a client used to publish or send message or bind consumer to queue.

```javascript
Client(name, url, [interval, confirm, logger, socketOptions])
```

Arguments:

​	name: client name. **default: random string six length**

​	url: connect url for rabbitmq. [*reference*](http://www.squaremobius.net/amqp.node/channel_api.html#connect). **default: amqp://localhost**

​	interval: reconnect time when connection closed. **default: 2000**

​	confirm: boolean, whether using [confirm channel](http://www.squaremobius.net/amqp.node/channel_api.html#confirmchannel). **default: true**

​	logger: logging object having info, error, warning functions. **default: console**

​	socketOptions: [reference](http://www.squaremobius.net/amqp.node/channel_api.html#connect)	

##### publish message to exchange

```javascript
Client.publish(ex, key, msg, type, exOptions, msgOptions)
```

Arguments:

​	exchange: exchange name.

​	key: routing key

​	msg: string or Object message

​	type: exchange type.

​	exOptions: [assertExchange options](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertExchange)

​	msgOptions: [publish or sendToQueue options](http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish)

##### send message to queue


```javascript
Client.send(queue, msg, queueOptions, msgOptions)
```

Arguments:

​	queue: queue name.

​	msg: string or Object message

​	queueOptions: [assertQueue options](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue)

​	msgOptions: [publish or sendToQueue options](http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish)

##### bind consumer to queue


```javascript
Client.consume(queue, handle, options, reconnect)
```

Arguments

​	queue: queue name

​	handle: message handle function(msg, channel)

​	options: [consume options](http://www.squaremobius.net/amqp.node/channel_api.html#channel_consume).  **example: { noAck: false, prefetch: 1}**

​	reconnect: whether reconnect when connection close. **default: true**

##### close the client


```
Client.close()
```

close the rabbitmq connection and channel.

### Examples

1. Create connect client

   ```javascript
   const Client = require('mq-reconnect');
   
   var client = new Client('DemoClient', 'amqp://localhost');
   ```

2. Send message to Queue

   ```javascript
   client
       .send('queue_name', 'there is message')
       .then(function(info){
          // info is the message tracking records
          // like: ['put buffer', 'wait confirm', 'server acked']
       })
       .catch(function(err){
       	// process err
   	})
   ```

3. Publish message to Exchange

   ```javascript
   client
     .publish('exchange_name', 'route_key', 'there is message', 'topic')
     .then(function(info){
        // info is the message tracking records
        // like: ['put buffer', 'wait confirm', 'server acked']
     })
     .catch(function(err){
        // process err
     })
   ```

4. Bind consumer to Queue

   ```javascript
   client
      .consume('queue_name', function handle(msg, ch) {
          console.log(msg.content.toString());
          return ch.ack(msg);
        },
        { noAck: false, prefetch: 1}
      )
      .catch(err => {
        console.log(err.message);
      });
   ```

