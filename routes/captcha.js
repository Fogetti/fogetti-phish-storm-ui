var express = require('express');
var router = express.Router();
var captcha = require('../controllers/captcha/index')

module.exports = function (secret) {

	/* POST message. */
	router.post('/', captcha.verify(secret));

	return router;
}