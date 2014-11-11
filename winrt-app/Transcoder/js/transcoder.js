/*global WinJS App Windows AWS Transcoder*/
/*eslint-disable no-console*/

(function () {
  WinJS.Namespace.define('Transcoder', {

    encodedFileUrls: [],

    resourceName: 'Transcoder',

    urls: {
      home: '/pages/home/home.html',
      config: '/pages/config/config.html'
    },

    assetUrls: {
      'Transcoder': '/images/transcoder.png',
      'S3': '/images/s3.png',
      'Error': '/images/error.png'
    },

    init: function() {
      var config = this.getConfiguration();
      this.App = new App(AWS, config);
      this.App.createPipeline();
    },

    getCredentials: function (resource) {
      var credential = null;
      var credentialList = null;

      var vault = new Windows.Security.Credentials.PasswordVault();
      try {
        credentialList = vault.findAllByResource(resource);
        if (credentialList.length > 0) {
          credential = credentialList[0];
        }
      } catch (exp) {
        // There are no credentials
      }
      return credential;
    },

    setCredentials: function (resource, username, password) {
      var vault = new Windows.Security.Credentials.PasswordVault();
      var credential = new Windows.Security.Credentials.PasswordCredential(resource, username, password);
      vault.add(credential);
    },

    removeCredentials: function (resource) {
      var vault = new Windows.Security.Credentials.PasswordVault();
      var credentialList = null;
      try {
        credentialList = vault.findAllByResource(resource);
        if (credentialList.length > 0) {
          for (var i = 0; i < credentialList.length; i++) {
            vault.remove(credentialList[i]);
          }
        }
      } catch (err) {
        // No credentials for this resource
      }
    },

    resetConfiguration: function () {
      delete this.App;
      this.removeCredentials(this.resourceName);
      var applicationData = Windows.Storage.ApplicationData.current;
      var localSettings = applicationData.localSettings;
      localSettings.values.remove('config');
    },

    saveConfiguration: function (config) {
      this.setCredentials(this.resourceName, config.accessKeyId, config.secretAccessKey);
      delete config.accessKeyId;
      delete config.secretAccessKey;
      var composite = new Windows.Storage.ApplicationDataCompositeValue();
      var applicationData = Windows.Storage.ApplicationData.current;
      var localSettings = applicationData.localSettings;
      for (var key in config) {
        composite[key] = config[key];
      }
      localSettings.values.config = composite;
    },

    getConfiguration: function() {
      var applicationData = Windows.Storage.ApplicationData.current;
      var localSettings = applicationData.localSettings;
      var composite = null, credential = null, config = null;
      try {
        composite = localSettings.values.config;
        credential = this.getCredentials(this.resourceName);
        if (credential && composite) {
          config = {};
          for (var key in composite) {
            if (composite.hasOwnProperty(key)) config[key] = composite[key];
          }
          credential.retrievePassword();
          config.accessKeyId = credential.userName;
          config.secretAccessKey = credential.password;
        }
      } catch (err) {
        console.log('There was an error retriving configuration: ', err);
      }
      return config;
    },

    isConfigured: function () {
      return !!this.getConfiguration();
    },

    extractUrls: function (data) {
      var jobOutput = data.Job.Output;
      var urls = {};
      urls.content = [Transcoder.App.storageHost, Transcoder.App.contentBucket,
        jobOutput.Key].join('/');
      urls.thumbnail = [Transcoder.App.storageHost, Transcoder.App.thumbnailBucket,
        jobOutput.ThumbnailPattern.replace('{count}', '00004.png')].join('/');
      return urls;
    }

  });
})();
