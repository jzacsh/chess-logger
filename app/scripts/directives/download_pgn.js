'use strict';


/** @type {string} */
var clDownloadFileNamePrefix = 'chess.jzacsh.com_game-';


/**
 * Builds a clickable download link of a PGN dump.
 *   <cl-download-pgn cl-gamekey"12345">Download Now!</cl-download-pgn>
 *
 * @param {!Object} historyService
 * @return {!angular.Directive}
 * @ngInject
 */
var clDownloadPgnFactory = function clDownloadPgnFactory(historyService) {
  return {
    restrict: 'E',
    transclude: true,
    template:
        '<a class="save download"' +
        '   cl-download-txt="get_pgn()"' +
        '   cl-download-file="get_file_name()"' +
        '   ng-transclude></a>',
    scope: {
      // historyService gamekey for PGN game lookup
      // @type {string}
      clGamekey: '='
    },
    link: function postLink(scope, element, attrs) {
      /** @return {string} */
      scope.get_file_name = function() {
        return clDownloadFileNamePrefix + scope.clGamekey + '.txt';
      };

      /** @return {string} */
      scope.get_pgn = function() {
        return historyService.readPgnDumps()[scope.clGamekey];
      };
    }
  };
};


angular.
    module('chessLoggerApp').
    directive('clDownloadPgn', [
      'historyService',
      clDownloadPgnFactory
    ]);
