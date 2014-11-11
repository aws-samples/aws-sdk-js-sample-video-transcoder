/*global WinJS Transcoder*/

(function () {

  WinJS.Namespace.define('Transcoder.Progress', {});

  WinJS.Namespace.define('Transcoder.Progress.Control', {

    create: function (progress, message) {
      var container = document.createElement('div');
      var progressBar = document.createElement('progress');
      var progressBarLabel = document.createElement('span');
      var progressMessage = document.createElement('p');
      var percentage = parseInt(progress.loaded / progress.total * 100);
      var dismissButton = document.createElement('span');
      var logo = document.createElement('img');
      logo.setAttribute('src', '/images/s3.png');
      logo.classList.add('logo');
      progressBar.classList.add('progress-bar');
      progressBar.value = percentage;
      progressBar.max = 100;
      progressBarLabel.classList.add('progress-bar-label');
      progressBarLabel.innerHTML = percentage + ' %';
      progressMessage.innerHTML = message.text;
      progressMessage.classList.add('progress-message');
      dismissButton.innerHTML = 'X';
      dismissButton.addEventListener('click', this.dismiss);
      dismissButton.classList.add('dismiss');
      container.classList.add('progress-indicator');
      container.setAttribute('data-message-id', message.id);
      container.appendChild(logo);
      container.appendChild(progressBar);
      container.appendChild(progressBarLabel);
      container.appendChild(progressMessage);
      container.appendChild(dismissButton);
      return container;
    },

    update: function (control, progress) {
      var progressBar = control.querySelector('.progress-bar');
      var progressBarLabel = control.querySelector('.progress-bar-label');
      var percentage = parseInt(progress.loaded / progress.total * 100);
      var progressMessage;
      progressBar.value = percentage;
      progressBarLabel.innerHTML = percentage + ' %';
      if (percentage === 100) {
        progressMessage = control.querySelector('.progress-message');
        progressMessage.innerHTML = 'Completed ' + progressMessage.innerHTML;
      }

    },

    dismiss: function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      var control = evt.target.parentNode;
      var id = control.getAttribute('data-message-id');
      evt.target.removeEventListener('click', this.dismiss);
      control.parentNode.removeChild(control);
      Transcoder.Progress.Manager.remove(id);
    }

  });

  WinJS.Namespace.define('Transcoder.Progress.Manager', {

    activeControls: {},

    update: function (id, progress) {
      var control = this.activeControls[id];
      Transcoder.Progress.Control.update(control, progress);
    },

    add: function(id, control) {
      this.activeControls = this.activeControls || {};
      this.activeControls[id] = control;
    },

    hasActive: function (id) {
      return id in this.activeControls;
    },

    remove: function (id) {
      delete this.activeControls[id];
    }

  });

})();
