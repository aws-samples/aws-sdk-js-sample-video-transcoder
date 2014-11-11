/*global WinJS Transcoder*/
/*eslint-disable no-console*/

// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
  'use strict';

  WinJS.UI.Pages.define('/pages/config/config.html', {
    // This function is called whenever a user navigates to this page. It
    // populates the page elements with the app's data.
    ready: function (element, options) {
      var form = document.getElementById('config-form');
      var config = Transcoder.getConfiguration();
      for (var key in config) {
        form[key].value = config[key];
      }
      form.addEventListener('submit', this.saveConfiguration);
    },

    unload: function () {
      // TODO: Respond to navigations away from this page.
    },

    updateLayout: function (element) {
      /// <param name='element' domElement='true' />

      // TODO: Respond to changes in layout.
    },

    saveConfiguration: function (evt) {
      var isValid = evt.target.checkValidity();
      evt.preventDefault();
      evt.stopPropagation();
      var config = {}, inputs, i, length;
      if (isValid) {
        inputs = document.getElementsByTagName('input');
        length = inputs.length;
        for (i = 0; i < length; i++) {
            config[inputs[i].name] = inputs[i].value;
        }
        try {
          Transcoder.saveConfiguration(config);
          Transcoder.init();
          WinJS.Navigation.navigate(Transcoder.urls.home);
          console.log('Configuration saved correctly.');
        } catch (err) {
          console.log('Error saving configuration: ', err);
        }
      }
    }

  });
})();
