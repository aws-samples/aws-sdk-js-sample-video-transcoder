/*global App */
/*eslint-disable no-console*/

var Application;

var assetUrls = {
  'Transcoder': 'images/transcoder.png',
  'S3': 'images/s3.png',
  'Security': 'images/security.png',
  'Error': 'images/error.png'
};

/**
 * Noop
 *
 */
var noop = function() {};

/**
 * Sets credentials and opens a new extension tab.
 *
 *
 */
var loadTab = function () {
  var options, config;
  if (localStorage.config) {
    config = JSON.parse(localStorage.config);
    Application = Application || new App(window.AWS, config);
    if (!Application.TabId) {
      var url = chrome.extension.getURL('index.html');
      chrome.tabs.create({url: url}, function(tab){
        Application.TabId = tab.id;
        Application.subscribe('app:request-progress', notifyProgress);
        Application.subscribe('app:request-success', notify);
        Application.subscribe('app:request-failure', notifyError);
        Application.subscribe('app:job-complete', updateView);
        Application.createPipeline();
      });
    }
  } else {
    options = {
      type: 'basic',
      title: 'No Credentials found',
      message: 'Set your credentials in the options page and then reload the extension.',
      iconUrl: assetUrls.Security
    };
    chrome.notifications.create('', options, noop);
  }
};

/**
 * Resets tab and reloads extension
 *
 *
 *
 */
var reset = function(tabId) {
  if (Application && tabId === Application.TabId) {
    delete Application.TabId;
    chrome.runtime.reload();
  }
};

/**
 * Triggers progress notifications for HTTP transfers
 *
 *
 *
 */
var notifyProgress = function(progress, message) {
  Application.notifications = Application.notifications || {};
  var progressCount = parseInt((progress.loaded / progress.total) * 100);
  var key, options = {}, status;
  for (var id in Application.notifications) {
    if (Application.notifications[id] === message.id) {
      key = id;
      break;
    }
  }
  if (key){
    if (progressCount === 100){
      status = 'Completed';
    }
    options.progress = progressCount;
    options.contextMessage = status || '';
    chrome.notifications.update(key, options, noop);
  } else {
    options = {
      type: 'progress',
      iconUrl: assetUrls[message.sender],
      title: 'Transfer progress',
      message: message.text,
      progress: progressCount,
      isClickable: true
    };
    chrome.notifications.create('', options, function(notificationId) {
      Application.notifications[notificationId] = message.id;
    });
  }
};


/**
 * Triggers generic notifications for AWS events
 *
 *
 *
 */
var notify = function(response, message) {
  var options = {
    type: 'basic',
    iconUrl: assetUrls[message.sender],
    title: 'Status',
    message: message.text
  };
  chrome.notifications.create('', options, noop);
};

/**
 * Triggers generic error notification for AWS events
 *
 *
 *
 */
var notifyError = function(error, message) {
  var options = {
    type: 'basic',
    iconUrl: assetUrls[message.sender],
    title: 'Error',
    message: message.text
  };
  chrome.notifications.create('', options, noop);
};


var extractUrls = function(data) {
  var jobOutput = data.Job.Output;
  var urls = {};
  urls.content = [Application.storageHost, Application.contentBucket,
    jobOutput.Key].join('/');
  urls.thumbnail = [Application.storageHost, Application.thumbnailBucket,
    jobOutput.ThumbnailPattern.replace('{count}', '00004.png')].join('/');
  return urls;
};


var updateView = function(data) {
  var urls = extractUrls(data);
  Application.publish('app:view-update', urls);
};



chrome.tabs.onRemoved.addListener(reset);
chrome.browserAction.onClicked.addListener(loadTab);
