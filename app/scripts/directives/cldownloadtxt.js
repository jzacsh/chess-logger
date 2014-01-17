'use strict';


/**
 * Turns an ordinary anchor tag into a downloading anchor tag.
 * NOTE: based entirely on: http://stackoverflow.com/a/12718755
 *
 * @param {Document} $document
 * @return {!angular.Directive}
 */
var clDownloadTxtFactory = function clDownloadTxtFactory($document) {
  return {
    restrict: 'A',
    scope: {
      // Content to populate the downloaded file with.
      // @type {string}
      clDownloadTxt: '=',

      // (Required) Name of the file to be downloaded, on change.
      // @type {string}
      clDownloadFile: '='
    },
    link: function postLink(scope, element, attrs) {
      if (element[0].nodeName != 'A') {
        throw new Error(
            'clDownloadTxtFactory directive is only implemented for ' +
            'anchor tags (got: nodeName="' + element[0].nodeName + '").');
      }

      scope.$watch('clDownloadFile', function(filePath) {
        element[0].download = filePath;
      });
      scope.$watch('clDownloadTxt', function(fileContent) {
        if (!scope.clDownloadFile) {
          return;
        }

        element[0].
            href = 'data:application/octet-stream;base64,' + btoa(fileContent);
      });
    }
  };
};

angular.
    module('chessLoggerApp').
    directive('clDownloadTxt', [
      '$document',
      clDownloadTxtFactory
    ]);
