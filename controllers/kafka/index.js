/**
 * Module dependencies.
 */
var v = require('valid-url');
var config = require('../../config');
var HashMap = require('hashmap');
var kafka = require('kafka-node'),
    producer = new kafka.Producer(
        new kafka.Client(config.kafka.zkconnection),
        {
          partitionerType: 3
        }
    ),
    consumer = new kafka.Consumer(
        new kafka.Client(config.kafka.zkconnection),
        [
          {
            topic: config.kafka.responsetopic,
            partition: 0
          }
        ],
        {
          autoCommit: true
        }
    );

module.exports = function (listener) {

  var module = {};

  listener.sockets.on('connection', function(socket) {

    var tooshort = /^(http|https):\/\/[^/]+[/]{0,1}$/;
    var map = new HashMap();

    var statusupdate = undefined;
    function updateStatus() {
        return setInterval(function() {
            socket.emit('verdict', {'value': 'NOT AVAILABLE YET'});
            socket.emit('status', {'value': 'CHECKING'});
        }, 1000);
    };

    var requestcount = 0;
    function timeoutRequestCount() {
        return setTimeout(function() {
          requestcount = 0;
        }, 30000);
    };

    producer.on('ready', function () {
      console.log('Producer ready');
    });
     
    producer.on('error', function (err) {
      console.log('Producer error: '+err);
    });

    consumer.on('message', function (message) {
      console.log('Message: '+message);
      console.log('Message key: '+message.key);
      console.log('Message value: '+message.value);
      var value = new Buffer(message.value).toString('utf8');
      clearInterval(statusupdate);
      socket.emit('finished', {'value': 'DONE'});
      socket.emit('verdict', {'value': value});
      socket.emit('status', {'value': 'FINISHED'});
      map.clear();
    });

    consumer.on('error', function (err) {
      console.log('Consumer error: '+err);
    });

    socket.on('url', function(data) {
      if (requestcount >= 10) {
        socket.emit('finished', {'value': 'DONE'});
        socket.emit('verdict', {'value': 'TOO MANY REQUESTS'});
        socket.emit('status', {'value': 'FINISHED'});
        timeoutRequestCount();
      } else if (data.url.match(tooshort)) {
        socket.emit('finished', {'value': 'DONE'});
        socket.emit('verdict', {'value': 'URL TOO SHORT'});
        socket.emit('status', {'value': 'FINISHED'});
      } else if (v.isHttpUri(data.url) || v.isHttpsUri(data.url)) {
        requestcount++;
        var encodedUrl = new Buffer(data.url).toString('base64');
        map.clear();
        map.set(encodedUrl, encodedUrl);
        send(encodedUrl, data.url);
        clearInterval(statusupdate);
        statusupdate = updateStatus();        
      } else {
        socket.emit('finished', {'value': 'DONE'});
        socket.emit('verdict', {'value': 'INVALID URL'});
        socket.emit('status', {'value': 'FINISHED'});
      }
    });

    function send(key, url) {
      payloads = [
        {
          topic: config.kafka.requesttopic,
          messages: new kafka.KeyedMessage(key, url),
          partition: 0
        }
      ];
      producer.send(payloads, function (err, data) {
        console.log('Producer send error: '+err);        
        console.log('Producer send data: '+data);        
      });
    };

  });

  return module;
};