var config = {};

config.redis = {};
config.kafka = {};
config.web = {};

config.redis.host = process.env.REDIS_HOST || 'petrucci';
config.redis.port = process.env.REDIS_PORT || 6379;
config.redis.auth = process.env.REDIS_AUTH || 'auth';
config.kafka.host = process.env.KAFKA_HOST || 'gilbert';
config.kafka.port = process.env.KAFKA_PORT || 9092;
config.kafka.topic = process.env.KAFKA_TOPIC || 'phish-storm';
config.kafka.zkconnection = process.env.KAFKA_ZK_CONNECTION || 'localhost:2181';
config.web.httpaddress = process.env.HTTP_LISTEN_ADDRESS || '127.0.0.1';
config.web.httpport = process.env.HTTP_PORT || 3002;
config.web.httpsport = process.env.HTTPS_PORT || 3003;

module.exports = config;