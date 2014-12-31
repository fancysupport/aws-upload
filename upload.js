var AWS = require('aws-sdk');
var fs = require('fs');
var zlib = require('zlib');
var argv = require('minimist')(process.argv.slice(2));

var codes = JSON.parse(fs.readFileSync(argv.codes));

var content_types = {
	'css': 'text/css',
	'gif': 'image/gif',
	'html': 'text/html',
	'ico': 'image/vnd.microsoft.icon',
	'jpeg': 'image/jpeg',
	'jpg': 'image/jpeg',
	'js': 'application/javascript',
	'json': 'application/json',
	'png': 'image/png'
};

function get_content_type(name) {
	var i = name.lastIndexOf('.') + 1;
	var ext = (i < 0) ? '' : name.substr(i);

	return content_types[ext.toLowerCase()] || 'application/octet-stream';
}

/*
	--codes=/path/to/codes.json
	--ref=cloudfrontCalleeReference  //triggers invalidation code
	--src=path/to/source.js //triggers upload code
	--dest=path/to/dest.js
*/

/*
	codes.json
	s3_key
	s3_secret
	cf_key
	cf_secret
	dist_id
	bucket: noslashes
*/

//$ node upload.js --codes=codes.json --dest=client.js --src=build/client.js --ref=pancakes

var invalidate = function() {
	var cf = new AWS.CloudFront({accessKeyId: codes.cf_key, secretAccessKey: codes.cf_secret});
	cf.createInvalidation({
		DistributionId: codes.dist_id,
		InvalidationBatch: {
			CallerReference: argv.ref + Date.now(),
			Paths: {
				Quantity: 1,
				Items: ['/'+argv.ref]
			}
		}
	}, function(err, data) {
		if (err) return console.log(err);
		console.log(data.Id, data.Status, data.InvalidationBatch.CallerReference, data.InvalidationBatch.Paths.Items);
	});
};

if (argv.src) {
	var file = fs.readFileSync(argv.src);
	zlib.gzip(file, function(err, result) {
		if (err) return console.log(err);

		var s3 = new AWS.S3({accessKeyId: codes.s3_key, secretAccessKey: codes.s3_secret});
		s3.putObject({
			ACL: 'public-read-write',
			Bucket: codes.bucket,
			Key: argv.dest,
			Body: result,
			ContentEncoding: 'gzip',
			ContentType: get_content_type(argv.src),

		}, function(err, data) {
			if (err) return console.log(err);
			console.log(argv.src + ' uploaded to ' + '/'+codes.bucket+'/'+argv.dest);

			if (argv.ref) invalidate();
		});
	});
} else if (argv.ref) invalidate();

//$ node upload.js --codes=codes.json --dest=client.js --src=build/client.js --ref=pancakes
