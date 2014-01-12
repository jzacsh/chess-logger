'use strict';

angular.
    module('chessLoggerApp').
    service('chessjsService', function() {
      /** chess.js global, loaded before angular is */
      this.Chessjs = Chess;
    });
