/*global WinJS Transcoder Windows MSApp*/

(function () {
  'use strict';

  WinJS.UI.Pages.define('/pages/home/home.html', {
    // This function is called whenever a user navigates to this page. It
    // populates the page elements with the app's data.
    ready: function (element, options) {
      var self = this;
      var i, fileUrls;
      self.edit = document.getElementById('edit');
      self.uploader = document.querySelector('.upload');
      self.edit.addEventListener('click', self.editConfiguration);
      self.uploader.addEventListener('click', self.initFilePicker);
      Transcoder.App.subscribe('app:request-success', function (response, message) {
        self.notify(response, message);
      });
      Transcoder.App.subscribe('app:request-failure', function (response, message) {
        self.notify(response, message);
      });
      Transcoder.App.subscribe('app:request-progress', function (progress, message) {
        self.showProgress(progress, message);
      });
      Transcoder.App.subscribe('app:job-complete', function (data) {
        self.updateView(data);
      });
      if (Transcoder.encodedFileUrls.length) {
        fileUrls = Transcoder.encodedFileUrls;
        for (i = 0; i < fileUrls.length; i++) {
          self.renderThumbnail(fileUrls[i]);
        }
      }
    },

    unload: function () {
      var self = this;
      self.edit.removeEventListener('click', self.editConfiguration);
      self.uploader.removeEventListener('click', self.initFilePicker);
      Transcoder.App.unsubscribe('app:request-success');
      Transcoder.App.unsubscribe('app:request-failure');
      Transcoder.App.unsubscribe('app:request-progress');
      Transcoder.App.unsubscribe('app:job-complete');
    },

    editConfiguration: function (evt) {
      evt.preventDefault();
      //Transcoder.resetConfiguration();
      WinJS.Navigation.navigate(Transcoder.urls.config);
    },

    initFilePicker: function (evt) {
      evt.preventDefault();
      // Create the picker object and set options
      var picker = new Windows.Storage.Pickers.FileOpenPicker();
      picker.viewMode = Windows.Storage.Pickers.PickerViewMode.list;
      picker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.documentsLibrary;
      picker.fileTypeFilter.replaceAll(['*']);

      // Open the picker for the user to pick a file
      picker.pickMultipleFilesAsync().then(function (files) {
        var fileList = [];
        if (files.size > 0) {
          for (var i = 0; i < files.length; i++) {
            fileList.push({ name: files[i].name, type: files[i].fileType, body: MSApp.createFileFromStorageFile(files[i]) });
          }
          Transcoder.App.upload(fileList);
        }
      });
    },

    notify: function (response, message) {
      var notifications = Windows.UI.Notifications;
      var template = notifications.ToastTemplateType.toastImageAndText01;
      var toastXml = notifications.ToastNotificationManager.getTemplateContent(template);
      var text = toastXml.getElementsByTagName('text');
      var image = toastXml.getElementsByTagName('image');
      var toast, toastNotifier;
      text[0].appendChild(toastXml.createTextNode(message.text));
      image[0].setAttribute('src', Transcoder.assetUrls[message.sender]);
      toast = new notifications.ToastNotification(toastXml);
      toastNotifier = notifications.ToastNotificationManager.createToastNotifier();
      toastNotifier.show(toast);
    },

    showProgress: function (progress, message) {
      var control;
      if (Transcoder.Progress.Manager.hasActive(message.id)) {
        Transcoder.Progress.Manager.update(message.id, progress);
      } else {
        control = Transcoder.Progress.Control.create(progress, message);
        this.uploader.appendChild(control);
        Transcoder.Progress.Manager.add(message.id, control);
      }
    },

    updateView: function (data) {
      var urls = Transcoder.extractUrls(data);
      Transcoder.encodedFileUrls.push(urls);
      this.renderThumbnail(urls);
    },

    renderThumbnail: function (urls) {
      var container = document.querySelector('.download');
      var anchor = document.createElement('a');
      var img = document.createElement('img');
      anchor.href = urls.content;
      anchor.classList.add('video');
      img.src = urls.thumbnail;
      img.classList.add('thumbnail');
      anchor.appendChild(img);
      container.appendChild(anchor);
      anchor.addEventListener('click', this.play);
    },

    play: function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      var url = evt.currentTarget.href;
      WinJS.Navigation.navigate('/pages/player/player.html', { url: url });
    }

  });
})();
