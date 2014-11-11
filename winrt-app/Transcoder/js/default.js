/*global WinJS Transcoder Windows*/

// For an introduction to the Navigation template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232506
(function () {
    'use strict';

    var activation = Windows.ApplicationModel.Activation;
    var app = WinJS.Application;
    var nav = WinJS.Navigation;
    var sched = WinJS.Utilities.Scheduler;
    var ui = WinJS.UI;


    app.addEventListener('activated', function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {

            nav.history = app.sessionState.history || {};
            nav.history.current.initialPlaceholder = true;

            // Optimize the load of the application and while the splash screen is shown, execute high priority scheduled work.
            ui.disableAnimations();
            var p = ui.processAll().then(function () {
                return sched.requestDrain(sched.Priority.aboveNormal + 1);
            }).then(function () {
                ui.enableAnimations();
            }).then(function () {
              var url;
              if (Transcoder.isConfigured()) {
                Transcoder.init();
                url = Transcoder.urls.home;
              } else {
                url = Transcoder.urls.config;
              }
              return nav.navigate(url);
            });

            args.setPromise(p);
        }
    });

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. If you need to
        // complete an asynchronous operation before your application is
        // suspended, call args.setPromise().
        app.sessionState.history = nav.history;
    };

    app.start();
})();
