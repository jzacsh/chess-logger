'use strict';



/**
 * @param {!angular.Scope} $scope
 * @constructor
 */
var ReviewCtrl = function ReviewCtrl($scope) {
  /** @private {!angular.Scope} */
  this.scope_ = $scope;
};


angular.
    module('chessLoggerApp').
    controller('ReviewCtrl', [
      '$scope',
      ReviewCtrl
    ]);
