/*global WinJS*/
/*eslint-disable no-console*/

// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
  'use strict';

  WinJS.UI.Pages.define('/pages/player/player.html', {
    // This function is called whenever a user navigates to this page. It
    // populates the page elements with the app's data.
    ready: function (element, options) {
      console.log(options);
      self.video = document.getElementById('player');
      self.video.setAttribute('src', options.url);
    },

    unload: function () {
      // TODO: Respond to navigations away from this page.
    },

    updateLayout: function (element) {
      /// <param name='element' domElement='true' />

      // TODO: Respond to changes in layout.
    }
  });
})();
