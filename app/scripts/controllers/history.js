'use strict';



/**
 * @param {!angular.Scope} $scope
 * @param {!Object} chessjsService
 *     github.com/jhlywa/chess.js
 * @param {!Object} historyService
 * @constructor
 */
var HistoryCtrl = function HistoryCtrl($scope, chessjsService, historyService) {
  /** @private {!angular.Scope} */
  this.scope_ = $scope;

  /** @private {!Object} */
  this.chessjsService_ = chessjsService;

  /** @type {!Object} */
  this.scope_.history_service = historyService;

  /**
   * Map of chess.js instances, representing games loaded from history, keyed
   * by their same keys used for historyService.
   * @private {Object.<string, !Object>}
   */
  this.chessGames_ = null;

  return this.scope_.controller = this;
};


/**
 * {@link RegExp} string intended to be suffixed to "Black" or "White",
 * intended in extracting player names.
 *
 * @type {string}
 */
HistoryCtrl.PgnPlayerSuffixRegExp = '\ \"(.*)\"';


/** @return {number} */
HistoryCtrl.prototype.gameCount = function() {
  return Object.keys(this.getAllGames()).length;
};


/** @return {!HistoryService.PgnHistory} */
HistoryCtrl.prototype.getAllGames = function() {
  if (!this.chessGames_) {
    this.chessGames_ = {};
    angular.forEach(
        this.scope_.history_service.readPgnDumps(),
        angular.bind(this, function(game, key) {
          this.chessGames_[key] = new this.chessjsService_.Chessjs();
          this.chessGames_[key].load_pgn(game);
        }));
  }
  return this.chessGames_;
};


/**
 * @param {string} gameKey
 * @return {number}
 *     New length of game-history, given deletion of {@code gameKey}.
 */
HistoryCtrl.prototype.deleteGame = function(gameKey) {
  this.chessGames_ = null;
  this.scope_.history_service.deletePgn(gameKey);
  return Object.keys(this.getAllGames()).length;
};


/**
 * Deletes all game history.
 *
 * @return {number}
 *     Number of games deleted.
 */
HistoryCtrl.prototype.deleteAllGames = function() {
  this.chessGames_ = null;
  return this.scope_.history_service.deleteAllPgns();
};


/**
 * @param {number} gameKey
 * @return {string}
 */
HistoryCtrl.prototype.getPlayerWhite = function(gameKey) {
  var matches = this.getAllGames()[gameKey].
      pgn().
      match(new RegExp('White' + HistoryCtrl.PgnPlayerSuffixRegExp));
  return matches ? matches.pop() : '';
};


/**
 * @param {number} gameKey
 * @return {string}
 */
HistoryCtrl.prototype.getPlayerBlack = function(gameKey) {
  var matches = this.getAllGames()[gameKey].
      pgn().
      match(new RegExp('Black' + HistoryCtrl.PgnPlayerSuffixRegExp));
  return matches ? matches.pop() : '';
};


/**
 * @param {number} gameKey
 * @return {boolean}
 */
HistoryCtrl.prototype.gameOver = function(gameKey) {
  return this.getAllGames()[gameKey].game_over();
};


/**
 * @param {number} gameKey
 * @return {string}
 *     HTML markup for the King of the winning color.
 */
HistoryCtrl.prototype.getWiningPlayerIcon = function(gameKey) {
  return this.getPlayerIcon(this.winningPlayer(gameKey));
};


/**
 * @param {string} player
 * @return {string}
 *     HTML for the correct color's king icon.
 */
HistoryCtrl.prototype.getPlayerIcon = function(player) {
  // TODO(zacsh): Replace this with the more general Utility extracted from
  // main.js's logic
  return player == 'w' ? '&#9812;' : '&#9818;';
};


/**
 * @param {number} gameKey
 * @return {string}
 */
HistoryCtrl.prototype.winningPlayer = function(gameKey) {
  var game = this.getAllGames()[gameKey];
  return game.game_over() && game.turn() === 'w' ?
         'b' : 'w';
};


/**
 * @param {number} gameKey
 * @return {string}
 */
HistoryCtrl.prototype.getGameResolution = function(gameKey) {
  return this.chessjsService_.util.
      getGameResolution(this.getAllGames()[gameKey]) || 'in progress';
};


/**
 * @param {number} gameKey
 * @return {number}
 */
HistoryCtrl.prototype.getMoveCount = function(gameKey) {
  return this.getAllGames()[gameKey].history().length;
};


angular.
  module('chessLoggerApp').
  controller('HistoryCtrl', [
    '$scope',
    'chessjsService',
    'historyService',
    HistoryCtrl
  ]);
