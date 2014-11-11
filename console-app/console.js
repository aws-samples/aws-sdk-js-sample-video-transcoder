#!/usr/bin/env node
/*eslint-disable no-console*/

var AWS = require('aws-sdk');
var App = require('./app');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var config = JSON.parse(fs.readFileSync('config.json'));

var Application = new App(AWS, config);
var pollLogger;
Application.createPipeline();

var files = process.argv;
var fileList = [], readStream;

var printProgress = function(progress, message){
  var percent = parseInt((progress.loaded / progress.total) * 100);
  process.stdout.write(message.text + ': ' + percent + ' %\r');
  if (percent === 100) {
    process.stdout.write('\n');
  }
};

var printNotification = function(response, message) {
  process.stdout.write(message.text + '\n');
};

var pollStart = function() {
  pollLogger = setInterval(function(){
    process.stdout.write('. ');
  }, 1000);
};

var pollEnd = function() {
  clearTimeout(pollLogger);
  process.stdout.write('\n');
};

var downloadObject = function(responseData){
  var key = responseData.Job.Output.Key;
  var writeStream = fs.createWriteStream('download/' + key);
  var s3 = new AWS.S3();
  var req = s3.getObject({Bucket: Application.contentBucket, Key:key});
  var progress = {loaded: 0, total: 0};
  var stream = req.createReadStream();
  var message = {};
  req.on('httpHeaders', function(statusCode, headers, response){
    progress.total = headers['content-length'];
  });
  stream.on('data', function(data){
    progress.loaded += data.length;
    message.text = 'Downloading ' + key;
    printProgress(progress, message);
  }).pipe(writeStream);
};

for (var i = 2; i < files.length; i++){
  readStream = fs.createReadStream(files[i]);
  fileList.push({body: readStream, name: path.basename(readStream.path), type: mime.lookup(files[i]) });
}

Application.upload(fileList);

Application.subscribe('app:request-progress', printProgress);
Application.subscribe('app:request-success', printNotification);
Application.subscribe('app:request-failure', printNotification);
Application.subscribe('app:waiter-started', pollStart);
Application.subscribe('app:waiter-ended', pollEnd);
Application.subscribe('app:job-complete', downloadObject);
