aws-upload
=========

A simple script to upload a file to S3 and then invalidate the file on CloudFront. Both of these can be ran independently.

    npm install .

```
--codes=/path/to/codes.json // a codes file described below
--ref=cf_callee_reference   // a string to use as the reference, this triggers the invalidation service
--src=/path/to/source.js    // location of the file to upload to s3, this triggers the upload service
--dest=/path/to/dest.js     // bucketless location of where to save in s3, or which file to invalidate on CF.

node upload.js --codes=secrets.json --src=build/batman.js --dest=batman.zip.js --ref=batman
```

```
codes.json
{
	"s3_key": "s3_key_string",
	"s3_secret": "s3_secret_string",

	"cf_key": "cf_key_string",
	"cf_secret": "cf_secret_string",
	"dist_id": "dist_id_string",
	"bucket": "bucket_name_string"
}
```
