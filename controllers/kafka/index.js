/**
 * Module dependencies.
 */
var config = require('../../config');
var HashMap = require('hashmap');
var kafka = require('kafka-node'),
    producer = new kafka.Producer(
        new kafka.Client(),
        {
          partitionerType: 3
        }
    ),
    consumer = new kafka.Consumer(
        new kafka.Client(),
        [
          {
            topic: config.kafka.responsetopic,
            partition: 0
          }
        ],
        {
          autoCommit: false
        }
    );

module.exports = function (listener) {

  var module = {};

  listener.sockets.on('connection', function(socket) {

    var map = new HashMap();
    var statusupdate = undefined;

    producer.on('ready', function () {});
     
    producer.on('error', function (err) {});

    consumer.on('message', function (message) {
      var key = new Buffer(message.key).toString('base64');
      var value = new Buffer(message.value).toString('utf8');
      if (map.has(key)) {
        clearInterval(statusupdate);
        socket.emit('status', {'value': 'FINISHED'});
        socket.emit('verdict', {'value': value});
      }
      map.clear();
    });

    consumer.on('error', function (err) {});

    socket.on('url', function(data) {
      var encodedUrl = new Buffer(data.url).toString('base64');
      map.clear();
      map.set(encodedUrl, encodedUrl);
      send(encodedUrl, data.url);
      statusupdate = updateStatus(socket);
    });

    function send(key, url) {
      payloads = [
        {
          topic: config.kafka.requesttopic,
          messages: new kafka.KeyedMessage(key, url),
          partition: 0
        }
      ];
      producer.send(payloads, function (err, data) {});
    };

    function updateStatus(socket) {
        return setInterval(function() {
            socket.emit('verdict', {'value': 'NOT AVAILABLE'});
            socket.emit('status', {'value': 'CHECKING'});
        }, 1000);
    };
  });

  return module;
};