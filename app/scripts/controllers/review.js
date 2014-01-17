'use strict';



/**
 * @param {!angular.$location} $location
 * @param {!angular.$routeParams} $routeParams
 * @param {!angular.Scope} $scope
 * @param {!Object} chessjsService
 *     github.com/jhlywa/chess.js
 * @param {!Object} historyService
 * @constructor
 */
var ReviewCtrl = function ReviewCtrl(
    $location, $routeParams, $scope, chessjsService, historyService) {
  /** @private {!angular.$location} */
  this.location_ = $location;

  /** @private {!angular.$routeParams} */
  this.routeParams_ = $routeParams;

  /** @private {!angular.Scope} */
  this.scope_ = $scope;

  /** @type {boolean} */
  this.scope_.upload_game = false;

  /** @private {!Object} */
  this.chessjsService_ = chessjsService;

  /** @private {!Object} */
  this.historyService_ = historyService;

  /** @type {!Object} */
  this.scope_.board = chessjsService.util;

  /** @type {!Object} */
  this.scope_.game = angular.copy(ReviewCtrl.DefaultGameData);

  // Try loading the current URL's game.
  this.loadCurrentGame_();

  return this.scope_.controller = this;
};


/**
 * Game key param intended to indicate user is attempting to enter a new game
 * PGN dump manually, not found in existing game history.
 *
 * @type {number}
 */
ReviewCtrl.NewGameKey = 0;


/**
 * @const
 * @type {!Object}
 */
ReviewCtrl.DefaultGameData = {
  pgn_dump: null,
  chessjs: null,
  formatted_pgn_dump: null,
  last_move_index: 0,
  jump_to: 0
};


/**
 * @param {number} index
 * @return {number}
 */
ReviewCtrl.prototype.readableIndex = function(index) {
  return parseInt(index, 10) + 1;
};


/** @private */
ReviewCtrl.prototype.loadCurrentGame_ = function() {
  var gameKey = this.routeParams_.gamekey.replace(/^:/, '');
  if (parseInt(gameKey, 10) === ReviewCtrl.NewGameKey) {
    this.scope_.upload_game = true;
  } else if (Object.keys(this.historyService_.readPgnDumps()).length &&
      this.historyService_.readPgnDumps()[gameKey]) {
    this.loadGame_(this.historyService_.readPgnDumps()[gameKey]);
  }
};


/**
 * @param {string} rawPgn
 * @return {boolean}
 *     Whether Chessjs recognized {@code rawPgn} as valid PGN format.
 */
ReviewCtrl.prototype.isRawPgnValid = function(rawPgn) {
  return rawPgn ? new this.chessjsService_.Chessjs().load_pgn(rawPgn) : false;
};


/**
 * PGN allows for almost the entire file to be on one line, break this up.
 *
 * @param {string} rawPgn
 * @return {string}
 *     {@code rawPgn} with linebreaks inserted for human-readability.
 * @private
 */
ReviewCtrl.prototype.lineBreakifyRawPgn_ = function(rawPgn) {
  return rawPgn.

    // breaks up each header field.
    replace(/\]\s*/g, ']\n').

    // breaks up each pair of moves.
    replace(/(\ )(\d+\.)/g, '$1\n$2');
};


/**
 * @param {string} rawPgn
 *    Manually entered (or pasted) PGN dump provided by user for save and
 *    review.
 */
ReviewCtrl.prototype.submitRawGamePgn = function(rawPgn) {
  var gameKey = HistoryService.newGameKey();
  this.historyService_.writePgnDump(gameKey, this.lineBreakifyRawPgn_(rawPgn));
  this.location_.path('/review:' + gameKey);
};


/** @return {number} */
ReviewCtrl.prototype.getLastMoveIndex = function() {
  return this.scope_.game.chessjs.history().length - 1;
};


/**
 * @param {string} pgnDump
 * @private
 */
ReviewCtrl.prototype.loadGame_ = function(pgnDump) {
  this.scope_.game.pgn_dump = pgnDump;

  this.scope_.game.chessjs = new this.chessjsService_.Chessjs();
  this.scope_.game.chessjs.load_pgn(this.scope_.game.pgn_dump);
  this.scope_.game.last_move_index = this.scope_.
      game.jump_to = this.getLastMoveIndex();

  this.formatPgnDump_();
};


/**
 * @param {number} jumpTo
 */
ReviewCtrl.prototype.jumpTo = function(jumpTo) {
  if (!this.scope_.game.chessjs) {
    return;
  }

  // Load any potentially missing history
  if (jumpTo > this.getLastMoveIndex()) {
    this.scope_.game.chessjs.load_pgn(this.scope_.game.pgn_dump);
  }

  // Undo any moves occuring in history, *after* requested jump
  while (jumpTo < this.getLastMoveIndex()) {
    this.scope_.game.chessjs.undo();  // Removes last index from history
  }
};


/** @private */
ReviewCtrl.prototype.formatPgnDump_ = function() {
  this.scope_.game.formatted_pgn_dump = {
    metadata: [],
    moves: []
  };
  angular.forEach(
      this.scope_.game.pgn_dump.split('\n'),
      angular.bind(this, function(line, index) {
        if (line) {
          if (this.isExchange(line)) {
            this.scope_.game.formatted_pgn_dump.moves.push(line);
          } else {
            this.scope_.game.formatted_pgn_dump.metadata.push(line);
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
  return this.scope_.game.chessjs ?
         this.scope_.game.chessjs.history().length : 0;
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
      '$location',
      '$routeParams',
      '$scope',
      'chessjsService',
      'historyService',
      ReviewCtrl
    ]);
