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

function invalidate() {
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
}

function upload(data, content_type, zipped) {
	var s3 = new AWS.S3({accessKeyId: codes.s3_key, secretAccessKey: codes.s3_secret});

	var opts = {
		ACL: 'public-read-write',
		Bucket: codes.bucket,
		Key: argv.dest,
		Body: data,
		ContentType: content_type
	};
	if (zipped) opts.ContentEncoding = 'gzip';

	s3.putObject(opts, function(err, data) {
		if (err) return console.log(err);
		console.log(argv.src + (zipped ? ' zipped and ' : '') + ' uploaded to ' + '/'+codes.bucket+'/'+argv.dest);

		if (argv.ref) invalidate();
	});
}

if (argv.src) {
	var file = fs.readFileSync(argv.src);

	var content_type = get_content_type(argv.src);

	// should only gzip non images
	if (content_type.indexOf('image/') !== 0) {
		zlib.gzip(file, function(err, result) {
			if (err) return console.log(err);

			upload(result, content_type, true);
		});
	} else {
		upload(file, content_type, false);
	}
} else if (argv.ref) {
	invalidate();
}
