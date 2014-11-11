## Node.js Console Application


#### Configuration

You will have to configure Amazon S3 and Amazon Elastic Transcoder using a ```config.json``` file.

#### Configuration Options

```javascript
{
  "region": "us-west-2",
  "inputBucket": "<source bucket>",
  "contentBucket": "<destination bucket>",
  "thumbnailBucket": "<thumbnail bucket>",
  "pipelineName": "<name of pipeline>",
  "presetId": "<system or custom preset id>",
  "transcoderRole": "arn:aws:iam::<account_id>:role/<role_name>"
}
```