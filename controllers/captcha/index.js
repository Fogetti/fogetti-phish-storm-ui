var https = require('https');

exports.verify = function(secret) {
	
	return function(req,res,next) {
		console.log('Verifying captcha');
		var responseString = req.body['g-recaptcha-response'];

		var options = {
		  hostname: 'www.google.com',
		  port: 443,
		  path: '/recaptcha/api/siteverify?secret='+secret+'&response='+responseString,
		  method: 'GET'
		};

		https.request(options, function(res) {
			console.log('Sending captcha request');
			var data = '';

			res.on('data', function(d) {
				data += d;
			});

			res.on('end', function() {
				var r =  JSON.parse(data);

				if(!r.success)
					return next({name: 'UnauthorizedError', message: 'Recaptcha verify failed'});

				console.log('Recaptcha verified');
				next();
			})
		})
		.on('error', function(err) {
			console.log('Error during captcha request');
			return next(err)
		})
		.end();
	}
	
}