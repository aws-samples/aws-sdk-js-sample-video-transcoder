/*global chrome Event*/
/*eslint-disable no-console*/

(function(){

  var dragHandler = function (evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
  };

  var dropHandler = function (evt) {
    evt.stopPropagation();
    evt.preventDefault();
    var files = evt.dataTransfer.files;
    var length = files.length;
    var fileList;
    if (length) {
      fileList = normalizeFiles(files);
      chrome.runtime.getBackgroundPage(function(background){
        background.Application.upload(fileList);
      });
    }
  };

  var clickHandler = function (evt) {
    evt.stopPropagation();
    evt.preventDefault();
    var fileSelect = document.getElementById('file-select');
    fileSelect.dispatchEvent(new Event('click'));
  };

  var changeHandler = function () {
    var files = this.files;
    var length = files.length;
    var fileList;
    if (length) {
      fileList = normalizeFiles(files);
      chrome.runtime.getBackgroundPage(function(background) {
        background.Application.upload(fileList);
      });
    }
  };


  /**
   * Wraps native file objects with an object wrapper to maintain a
   * consistent interface with Node.js streams.
   *
   *
   */
  var normalizeFiles = function(files) {
    var length = files.length;
    var fileList = [], file;
    for (var i = 0; i < length; i++) {
      file = files[i];
      fileList.push({body: file, name: file.name, type:file.type});
    }
    return fileList;
  };

  /**
   * Populate thumbnails and link to download after transcoder job
   * completes.
   *
   *
   */
  var populateThumbnails = function(urls) {
    var anchor = document.createElement('a');
    var img = document.createElement('img');
    var container = document.getElementById('download-box');
    anchor.href = urls.content;
    anchor.className = 'download';
    anchor.setAttribute('download', '');
    img.src = urls.thumbnail;
    img.className = 'img-thumbnail';
    anchor.appendChild(img);
    container.appendChild(anchor);
  };

  /**
   * Setup event listeners
   *
   *
   */
  var initialize = function (){
    var fileBox = document.getElementById('file-box');
    var fileSelect = document.getElementById('file-select');
    var Application;
    chrome.runtime.getBackgroundPage(function(background){
      Application = background.Application;
      Application.subscribe('app:view-update', populateThumbnails);
    });
    fileBox.addEventListener('click', clickHandler);
    fileBox.addEventListener('dragover', dragHandler);
    fileBox.addEventListener('drop', dropHandler);
    fileSelect.addEventListener('change', changeHandler);
  };

  document.addEventListener('DOMContentLoaded', initialize);

})();
