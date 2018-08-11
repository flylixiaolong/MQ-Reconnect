## MQ-Reconnect

This package is one simple wrapper for [amqplib](http://www.squaremobius.net/amqp.node/).

### Document

```javascript
Client(name, url, interval, confirm, logger, socketOptions)
```


```javascript
Client.publish(ex, key, msg, type, exOptions, msgOptions)
```

```javascript
Client.send(queue, msg, queueOptions, msgOptions)
```

```javascript
Client.consume(queue, handle, options, reconnect)
```

```
Client.close()
```

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

