'use strict';



/**
 * @param {!angular.$routeParams} $routeParams
 * @param {!angular.Scope} $scope
 * @param {!Object} chessjsService
 *     github.com/jhlywa/chess.js
 * @param {!Object} historyService
 * @constructor
 */
var ReviewCtrl = function ReviewCtrl(
    $routeParams, $scope, chessjsService, historyService) {
  /** @private {!angular.$routeParams} */
  this.$routeParams_ = $routeParams;

  /** @private {!angular.Scope} */
  this.scope_ = $scope;

  /** @private {!Object} */
  this.chessjsService_ = chessjsService;

  /** @private {!Object} */
  this.historyService_ = historyService;

  /** @type {number} */
  this.scope_.jump_to = 0;

  /** @type {number} */
  this.scope_.last_move_index = 0;

  /** @type {!Object} */
  this.scope_.board = chessjsService.util;

  /** @type {!Object} */
  this.scope_.chessjs = null;

  /** @type {!Object} */
  this.scope_.pgn_dump = null;

  /** @type {!Object} */
  this.scope_.formatted_pgn_dump = null;

  // Try loading the current URL's game.
  this.loadCurrentGame_();

  return this.scope_.controller = this;
};


/**
 * @param {number} index
 * @return {number}
 */
ReviewCtrl.prototype.readableIndex = function(index) {
  return parseInt(index) + 1;
};


/** @private */
ReviewCtrl.prototype.loadCurrentGame_ = function() {
  var gameKey = this.$routeParams_.gameid.replace(/^:/, '');
  if (gameKey &&
      Object.keys(this.historyService_.readPgnDumps()).length &&
      this.historyService_.readPgnDumps()[gameKey]) {
    this.loadGame_(this.historyService_.readPgnDumps()[gameKey]);
  }
};


/** @return {number} */
ReviewCtrl.prototype.getLastMoveIndex = function() {
  return this.scope_.chessjs.history().length - 1;
};


/**
 * @param {string} pgnDump
 * @private
 */
ReviewCtrl.prototype.loadGame_ = function(pgnDump) {
  this.scope_.pgn_dump = pgnDump;

  this.scope_.chessjs = new this.chessjsService_.Chessjs();
  this.scope_.chessjs.load_pgn(this.scope_.pgn_dump);
  this.scope_.last_move_index = this.scope_.jump_to = this.getLastMoveIndex();

  this.formatPgnDump_();
};


/**
 * @param {number} jumpTo
 */
ReviewCtrl.prototype.jumpTo = function(jumpTo) {
  if (!this.scope_.chessjs) {
    return;
  }

  // Load any potentially missing history
  if (jumpTo > this.getLastMoveIndex()) {
    this.scope_.chessjs.load_pgn(this.scope_.pgn_dump);
  }

  // Undo any moves occuring in history, *after* requested jump
  while (jumpTo < this.getLastMoveIndex()) {
    this.scope_.chessjs.undo();  // Removes last index from history
  }
};


/** @private */
ReviewCtrl.prototype.formatPgnDump_ = function() {
  this.scope_.formatted_pgn_dump = {
    metadata: [],
    moves: []
  };
  angular.forEach(
      this.scope_.pgn_dump.split('\n'),
      angular.bind(this, function(line, index) {
        if (line) {
          if (this.isExchange(line)) {
            this.scope_.formatted_pgn_dump.moves.push(line);
          } else {
            this.scope_.formatted_pgn_dump.metadata.push(line);
          }
        }
      }));
};


/**
 * @param {string} pgnLine
 * @return {boolean}
 */
ReviewCtrl.prototype.isExchange = function(pgnLine) {
  return !pgnLine.match(/\[/);  // Metadata is surrounded in square brackets
};


/**
 * @return {number}
 *     Number of the last move in the game currently being displayed.
 */
ReviewCtrl.prototype.getMoveNumber = function() {
  return this.scope_.chessjs ? this.scope_.chessjs.history().length : 0;
};


/**
 * @return {number}
 *     Number of the current player exchange in view on the board.
 */
ReviewCtrl.prototype.getExchangeNumber = function() {
  return Math.floor(this.getMoveNumber() ? (this.getMoveNumber() / 2) : 0);
};


angular.
    module('chessLoggerApp').
    controller('ReviewCtrl', [
      '$routeParams',
      '$scope',
      'chessjsService',
      'historyService',
      ReviewCtrl
    ]);
