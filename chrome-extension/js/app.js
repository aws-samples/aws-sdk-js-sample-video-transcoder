/*eslint-disable no-console*/

/*
 * Setup defaults and perform housekeeping
 *
 */
var App = function(awsObj, config) {
  this.pipelineName = config.pipelineName;
  this.inputBucket = config.inputBucket;
  this.contentBucket = config.contentBucket;
  this.thumbnailBucket = config.thumbnailBucket;
  this.transcoderRole = config.transcoderRole;
  this.presetId = config.presetId;
  this.channels = {};
  this.storageHost = ['https://s3-', config.region, '.amazonaws.com'].join('');
  this.AWS = awsObj;
  this.AWS.config.update({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region
  });
};


/**
 * Upload files to S3 which can then be used as input to Elastic Transcoder
 *
 */
App.prototype.upload = function(files) {
  var self = this,
      length = files.length,
      AWS = self.AWS,
      s3 = new AWS.S3({params: {Bucket : self.inputBucket}}),
      params, i, request, createJob, file, notify, message;

  // Callback binder
  var binder = function(func){
    var args = Array.prototype.slice.call(arguments, 1);
    return function() {
      return func.apply(self, Array.prototype.slice.call(arguments, 0).concat(args));
    };
  };

  for (i = 0; i < length; i++) {
    file = files[i];
    params = {
      Key: file.name,
      ContentType: file.type,
      Body: file.body
    };
    createJob = binder(self.createJob, file.name);
    message = {};
    message.sender = 'S3';
    message.text = 'Uploading: ' + file.name;
    message.id = self.getUniqueString();
    notify = binder(self.notifyProgress, message);
    request = s3.putObject(params);
    request.on('success', createJob)
      .on('httpUploadProgress', notify)
      .on('error', function(error, response) {
        self.error(error);
      });
    request.send();
  }
};


/**
 *
 *
 */
App.prototype.getUniqueString = function() {
  return Math.random().toString(36).substring(7) + '-' + Date.now();
};


/**
 * Creates a transcoder job and adds it to the default pipeline
 *
 */
App.prototype.createJob = function(response, key) {
  var self = this,
      AWS = self.AWS,
      transcoder = new AWS.ElasticTranscoder(),
      params, outputKey, frag, request, thumbPattern;

  frag = self.getUniqueString();
  outputKey = frag + '.mp4';
  thumbPattern = frag + '/thumb-{count}';
  params = {
    PipelineId: self.pipelineId,
    Input: {
      Key: key,
      AspectRatio: 'auto',
      FrameRate: 'auto',
      Resolution: 'auto',
      Container: 'auto',
      Interlaced: 'auto'
    },
    Output: {
      Key: outputKey,
      PresetId: self.presetId,
      ThumbnailPattern: thumbPattern
    }
  };
  request = transcoder.createJob(params);
  request.on('success', function(response){
    var message = {};
    message.sender = 'Transcoder';
    message.text = 'The job with ID: '
      + response.data.Job.Id + ' was created successfully';
    self.publish('app:request-success', response, message);
    self.jobCreated(response);
  });
  request.on('error', function(error, response) {
    self.error(error);
  });
  request.send();
};


/**
 *
 *
 *
 */
App.prototype.jobCreated = function(response) {
  var self = this;
  var AWS = self.AWS;
  var transcoder = new AWS.ElasticTranscoder();
  var jobId = response.data.Job.Id;
  transcoder.waitFor('jobComplete', {Id: jobId}, function(err, data){
    var message = {};
    message.sender = 'Transcoder';
    if (err) {
      self.error(err, data);
    } else {
      message.text = 'The job with ID: ' + jobId + ' completed successfully';
      self.publish('app:waiter-ended');
      self.publish('app:request-success', data, message);
      self.publish('app:job-complete', data);
    }
  });
  self.publish('app:waiter-started');
};


/**
 * Default error handler
 *
 */
App.prototype.error = function (error, response) {
  var message = {};
  message.text = error.message;
  message.sender = 'Error';
  this.publish('app:request-failure', error, message);
};


/**
 * Create a Elastic Transcoder pipeline. The pipeline is created only
 * if there is no existing pipeline.
 *
 */
App.prototype.createPipeline = function() {
  var self = this;
  var AWS = self.AWS;
  var transcoder = new AWS.ElasticTranscoder();
  var request = transcoder.listPipelines();
  var params, message;
  request.on('success', function(response){
    self.pipelineId = self.getPipelineId(self.pipelineName, response.data.Pipelines);
    if (!self.pipelineId) {
      params = {
        InputBucket: self.inputBucket,
        Name: self.pipelineName,
        Role: self.transcoderRole,
        ContentConfig: {
          Bucket: self.contentBucket
        },
        ThumbnailConfig: {
          Bucket: self.thumbnailBucket
        },
        Notifications: {
          Completed: '',
          Error: '',
          Progressing: '',
          Warning: ''
        }
      };
      transcoder.createPipeline(params, function(err, data){
        if (err) {
          self.error(err, data);
        } else {
          self.pipelineId = data.Pipeline.Id;
          message = {};
          message.sender = 'Transcoder';
          message.text = 'The pipeline was created';
          self.publish('app:request-success', data, message);
        }
      });
    }
  });
  request.on('error', function(error, response) {
    self.error(error);
  });
  request.send();
};


/**
 * Check if pipeline with same name already exists
 *
 */
App.prototype.getPipelineId = function(pipelineName, pipelines){
  var i, length = pipelines.length;
  for (i = 0;i < length; i++){
    if (pipelines[i].Name === pipelineName){
      return pipelines[i].Id;
    }
  }
  return null;
};

/**
 * Publishes a message to a channel
 *
 */
App.prototype.publish = function(channelId) {
  var self = this;
  var channels = self.channels;
  var channel = channels[channelId];
  var i, length;

  if (channel) {
    length = channel.length;
    for (i = 0; i < length; i++) {
      channel[i].apply(self, Array.prototype.slice.call(arguments, 1));
    }
  }
};

/**
 * Adds subscription to a channel
 *
 */
App.prototype.subscribe = function(channelId, callback) {
  var self = this;
  var channels = self.channels;
  var channel = channels[channelId] = channels[channelId] || [];

  // Prevent duplicate subscribers
  if (typeof callback === 'function' && channel.indexOf(callback) === -1) {
    channel.push(callback);
  } else {
    throw new Error('The callback provided is not a function');
  }
};


/**
 * Removes subscription from channel
 *
 */
App.prototype.unsubscribe = function(channelId, callback) {
  var channels = this.channels;
  var channel = channels[channelId] || [];
  var index;

  if (channel.length) {
    if (!callback) {
      channel.length = 0;
    } else if (typeof callback === 'function') {
      index = channel.indexOf(callback);
      if ( index > -1 ) {
        channel.splice(index, 1);
      }
    }
  }
};


/**
 * Broadcasts transfer progress events
 *
 *
 *
 */
App.prototype.notifyProgress = function(progress, response, message) {
  this.publish('app:request-progress', progress, message);
};

if (typeof module !== 'undefined') module.exports = App;
