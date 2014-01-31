'use strict';



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.$timeout} $timeout
 * @param {!Object} chessjsService
 *     github.com/jhlywa/chess.js
 * @param {!Object} historyService
 * @constructor
 */
var HistoryCtrl = function HistoryCtrl(
    $scope, $timeout, chessjsService, historyService) {
  /** @private {!angular.Scope} */
  this.scope_ = $scope;

  /** @type {!angular.$timeout} */
  this.scope_.timeout = $timeout;

  /**
   * Promises of pending action being kept in limbo for users to undo, keyed by
   * the gamekey the action will be taken on.
   *
   * @type {!Object.<string, !angular.$q.Promise>}
   */
  this.scope_.undo_limbo = {};

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

  /**
   * Static reference to {@link HistoryCtrl} constructor.
   *
   * @type {HistoryCtrl}.
   */
  this.scope_.Ctrl = HistoryCtrl;

  return this.scope_.controller = this;
};


/**
 * Milliseconds allowed for user to undo action.
 *
 * @type {number}
 */
HistoryCtrl.UndoTimeout = 5000;


/**
 * Pseudo-gamekey used to identify DELETE-ALL pending game action.
 *
 * @type {number}
 */
HistoryCtrl.DeleteAllUndoKey = -1;


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
 */
HistoryCtrl.prototype.deleteGame = function(gameKey) {
  this.scope_.undo_limbo[gameKey] = this.scope_.timeout(
      angular.bind(this, function() {
        this.chessGames_ = null;
        this.scope_.history_service.deletePgn(gameKey);
      }),
      HistoryCtrl.UndoTimeout);

  var cleanUpLimbo = angular.bind(this, function() {
    this.scope_.undo_limbo[gameKey] = false;
  });
  this.scope_.undo_limbo[gameKey].then(cleanUpLimbo, cleanUpLimbo);
};


/**
 * Deletes all game history.
 */
HistoryCtrl.prototype.deleteAllGames = function() {
  this.scope_.undo_limbo[HistoryCtrl.DeleteAllUndoKey] = this.scope_.timeout(
      angular.bind(this, function() {
        this.chessGames_ = null;
        this.scope_.history_service.deleteAllPgns();
      }),
      HistoryCtrl.UndoTimeout);

  var cleanUpLimbo = angular.bind(this, function() {
    this.scope_.undo_limbo[HistoryCtrl.DeleteAllUndoKey] = false;
  });
  this.scope_.undo_limbo[HistoryCtrl.DeleteAllUndoKey].
      then(cleanUpLimbo, cleanUpLimbo);
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
  return !!this.getAllGames()[gameKey] &&
         this.getAllGames()[gameKey].game_over();
};


/**
 * @param {number} gameKey
 * @return {string}
 *     HTML markup for the King of the winning color.
 */
HistoryCtrl.prototype.getWiningPlayerIcon = function(gameKey) {
  var winningPlayer = this.winningPlayer(gameKey);
  return winningPlayer ? this.getPlayerIcon(winningPlayer) : 'N/A';
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
 * @return {?string}
 */
HistoryCtrl.prototype.winningPlayer = function(gameKey) {
  return this.gameOver(gameKey) ?
         (this.getAllGames()[gameKey].turn() === 'w' ? 'b' : 'w') :
         null;
};


/**
 * @param {number} gameKey
 * @return {string}
 */
HistoryCtrl.prototype.getGameResolution = function(gameKey) {
  return this.chessjsService_.util.
      getGameResolution(this.getAllGames()[gameKey]);
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
    '$timeout',
    'chessjsService',
    'historyService',
    HistoryCtrl
  ]);
