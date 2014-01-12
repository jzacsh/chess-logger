'use strict';

angular.
    module('chessLoggerApp').
    service('chessjsService', function chessjsService() {
      /** chess.js global, loaded before angular is */
      this.Chessjs = Chess;
    });
