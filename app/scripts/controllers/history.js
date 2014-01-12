'use strict';



/**
 * @param {!angular.Scope} $scope
 * @param {!Object} historyService
 * @constructor
 */
var HistoryCtrl = function HistoryCtrl($scope, historyService) {
  /** @private {!angular.Scope} */
  this.scope_ = $scope;

  /** @private {!Object} */
  this.historyService_ = historyService;

  return this.scope_.controller = this;
};


/** @return {!HistoryService.PgnHistory} */
HistoryCtrl.prototype.getAllGames = function() {
  return this.historyService_.readPgnDumps();
};


/**
 * @param {string} gameKey
 * @return {number}
 *     New length of game-history, given deletion of {@code gameKey}.
 */
HistoryCtrl.prototype.deleteGame = function(gameKey) {
  this.historyService_.deletePgn(gameKey);
  return Object.keys(this.getAllGames()).length;
};


/**
 * Deletes all game history.
 *
 * @return {number}
 *     Number of games deleted.
 */
HistoryCtrl.prototype.deleteAllGames = function() {
  return this.historyService_.deleteAllPgns();
};


angular.
  module('chessLoggerApp').
  controller('HistoryCtrl', [
    '$scope',
    'historyService',
    HistoryCtrl
  ]);
