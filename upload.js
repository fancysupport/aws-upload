var AWS = require('aws-sdk');
var fs = require('fs');
var zlib = require('zlib');
var argv = require('minimist')(process.argv.slice(2));

var codes = JSON.parse(fs.readFileSync(argv.codes));

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
			CallerReference: argv.ref,
			Paths: {
				Quantity: 1,
				Items: ['/'+codes.bucket+'/'+argv.dest]
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
			Bucket: codes.bucket,
			Key: argv.dest,
			Body: result,
			ContentEncoding: 'gzip',
			ContentType: 'application/javascript',

			}, function(err, data) {
				if (err) return console.log(err);
				console.log(argv.src + ' uploaded to ' + path.join('/', codes.bucket, argv.dest));

				if (argv.ref) invalidate();
		});
	});
} else if (argv.ref) invalidate();
