/*global chrome*/
/*eslint-disable no-console*/
(function() {

  /**
   * Save configuration in localStorage
   *
   *
   */
  var saveConfiguration = function (evt) {
    var isValid = evt.target.checkValidity();
    evt.preventDefault();
    evt.stopPropagation();
    var config = {};
    var inputs, i, length, notification;
    if (isValid) {
      inputs = document.getElementsByTagName('input');
      length = inputs.length;
      for (i = 0; i < length; i++) {
        config[inputs[i].name] = inputs[i].value;
      }
      try {
        localStorage.config = JSON.stringify(config);
        notification = document.getElementById('notification');
        notification.classList.remove('hidden');
      } catch (err) {
        console.log('Error saving configuration: ', err);
      }
    }
  };

  var init = function () {
    var form = document.getElementById('config-form');
    var config;
    if (localStorage.config) {
      config =  JSON.parse(localStorage.config) || undefined;
      for (var key in config) {
        form[key].value = config[key];
      }
    }
    form.addEventListener('submit', saveConfiguration);
  };

  window.addEventListener('load', init);

})();
