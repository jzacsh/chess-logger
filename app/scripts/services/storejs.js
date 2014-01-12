'use strict';

angular.
    module('chessLoggerApp').
    service('storejsService', function() {
      /** store.js global, loaded before angular is */
      this.storejs = store;
    });
