'use strict';

angular.
    module('chessLoggerApp').
    service('storejsService', function storejsService() {
      /** store.js global, loaded before angular is */
      this.storejs = store;
    });
