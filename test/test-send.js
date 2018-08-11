const Client = require('../lib');
const assert = require('assert');

describe('Test SendMsg', function(){
  describe('Test ConfirmChannel SendMsg', function(){
    // disable logging
    var logger = {
      info: ()=>{},
      warn: ()=>{},
      error:()=>{}
    }
    var client = new Client(null, null, logger);

    it('Test Publish Msg', function(){
      return client
        .publish('hello', 'one', 'hello mq-reconnect', 'topic')
        .then(function(info){
          assert.deepEqual(info, ['put buffer', 'wait confirm', 'server acked']);
          client.close();
        })
    })

    it('Test Send Msg', function(){
      return client
        .send('hello', 'hello mq-reconnect')
        .then(function(info){
          assert.deepEqual(info, ['put buffer', 'wait confirm', 'server acked']);
        })
    })

    after(function() {
      client.close();
    })
  })

  describe('Test RegularChannel SendMsg', function(){
    // disable logging
    var logger = {
      info: ()=>{},
      warn: ()=>{},
      error:()=>{}
    }
    var client = new Client(null, null, false, logger);

    it('Test Publish Msg', function(){
      return client
        .publish('hello', 'one', 'hello mq-reconnect', 'topic')
        .then(function(info){
          assert.deepEqual(info, ['put buffer']);
        })
    })

    it('Test Send Msg', function(){
      return client
        .send('hello', 'hello mq-reconnect')
        .then(function(info){
          assert.deepEqual(info, ['put buffer']);
        })
    })

    after(function() {
      client.close();
    })
  })
})
