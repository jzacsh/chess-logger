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

  this.scope_.time_series = {
    /**
     * Exchange number to total relative value of each players piece on the
     * board.
     *
     * @type {!Array.<{w: number, b: number}>}
     */
    historic_relative_values: [],
    exchange_part_of: 0
  };

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

  this.scope_.Ctrl = ReviewCtrl;
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
 * @type {number}
 */
ReviewCtrl.MaximumTotalValue = 39;


/**
 * @const
 * @type {!Object}
 */
ReviewCtrl.DefaultGameData = {
  pgn_dump: null,
  dynamic: null,
  original: null,
  formatted_pgn_dump: null,
  jump_to: 0
};


/** @return {string} */
ReviewCtrl.prototype.getGamekey = function() {
  return this.routeParams_.gamekey.replace(/^:/, '');
};


/** @private */
ReviewCtrl.prototype.loadCurrentGame_ = function() {
  var gameKey = this.getGamekey();
  if (parseInt(gameKey, 10) === ReviewCtrl.NewGameKey) {
    this.scope_.upload_game = true;
  } else if (this.historyService_.havePgnKey(gameKey)) {
    this.loadGame_(this.historyService_.readPgnDumps()[gameKey]);
  }
};


/**
 * @param {string} rawPgn
 * @return {boolean}
 *     Whether Chessjs recognized {@code rawPgn} as valid PGN format.
 */
ReviewCtrl.prototype.isRawPgnValid = function(rawPgn) {
  return rawPgn ?
         !!(new this.chessjsService_.Chessjs().load_pgn(rawPgn)) :
         false;
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
ReviewCtrl.prototype.getLastOriginalIndex = function() {
  return this.scope_.game.original.history().length - 1;
};


/** @return {number} */
ReviewCtrl.prototype.getLastDynamicIndex = function() {
  return this.scope_.game.dynamic.history().length - 1;
};


/** @return {number} */
ReviewCtrl.prototype.getDynamicReadableIndex = function() {
  return parseInt(this.getLastDynamicIndex(), 10) + 1;
};


/**
 * @return {number}
 *     Number of the current player exchange in view on the board.
 */
ReviewCtrl.prototype.getMoveLineNumber = function() {
  var lastMoveIndex = this.getLastDynamicIndex();
  return lastMoveIndex ? Math.floor(lastMoveIndex / 2) : 0;
};


/**
 * @param {string} pgnDump
 * @private
 */
ReviewCtrl.prototype.loadGame_ = function(pgnDump) {
  this.scope_.game.pgn_dump = pgnDump;

  // The live game, on display
  this.scope_.game.dynamic = new this.chessjsService_.Chessjs();
  this.scope_.game.dynamic.load_pgn(this.scope_.game.pgn_dump);

  // Full game in its entirety, for readonly purposes
  this.scope_.game.original = new this.chessjsService_.Chessjs();
  this.scope_.game.original.load_pgn(this.scope_.game.pgn_dump);

  this.scope_.game.jump_to = this.getLastOriginalIndex();

  this.formatPgnDump_();

  this.buildTimeSeries_();
};


/** @private */
ReviewCtrl.prototype.buildTimeSeries_ = function() {
  var history = [];

  // Load any potentially missing history
  var review = new this.chessjsService_.Chessjs();
  review.load_pgn(this.scope_.game.pgn_dump);

  if (review.history().length % 2) {
    review.undo();  // Undo white's move w/o response
  }
  this.scope_.time_series.exchange_part_of = parseFloat(
      (100 / (review.history().length / 2)).toFixed(2), 10);
  while (review.history().length) {
    history.push(this.scope_.board.getTotalRelativeValues(review));

    // Undo this exchange
    review.undo();  // undo black's move
    review.undo();  // undo white's move
  }
  this.scope_.time_series.historic_relative_values = history.reverse();
};


/**
 * @param {number} value
 * @return {number}
 *     Percentage, relative to 39unit maximum.
 */
ReviewCtrl.getTimeSeriesRelativeHeight = function(value) {
  return Math.floor(value / 39 * 100);
};


/**
 * @param {number} jumpTo
 */
ReviewCtrl.prototype.jumpTo = function(jumpTo) {
  var jump = parseInt(jumpTo, 10);
  if (!this.scope_.game.dynamic || !this.canJumpTo_(jump)) {
    return;
  }

  // Load any potentially missing history
  if (jump > this.getLastDynamicIndex()) {
    this.scope_.game.dynamic.load_pgn(this.scope_.game.original.pgn());
  }

  // Undo any moves occuring in history, *after* requested jump
  while (jump < this.getLastDynamicIndex()) {
    this.scope_.game.dynamic.undo();  // Removes last index from history
  }

  this.scope_.game.jump_to = jump;
};


/**
 * @param {number} jumpTo
 * @return {boolean}
 *     Whether {@code jumpTo} is a real location in history of this game.
 * @private
 */
ReviewCtrl.prototype.canJumpTo_ = function(jumpTo) {
  return jumpTo <= this.getLastOriginalIndex() && jumpTo >= 0;
};


/** {@link #jumpTo} wrapper */
ReviewCtrl.prototype.jumpPrevious = function() {
  if (this.canJumpPrevious()) {
    var jumpTo = parseInt(this.scope_.game.jump_to, 10);
    this.jumpTo(--jumpTo);
  }
};


/** @return {boolean} */
ReviewCtrl.prototype.canJumpPrevious = function() {
  return this.canJumpTo_(parseInt(this.scope_.game.jump_to, 10) - 1);
};


/** {@link #jumpTo} wrapper. */
ReviewCtrl.prototype.jumpNext = function() {
  if (this.canJumpNext()) {
    var jumpTo = parseInt(this.scope_.game.jump_to, 10);
    this.jumpTo(++jumpTo);
  }
};

/** @return {boolean} */
ReviewCtrl.prototype.canJumpNext = function() {
  return this.canJumpTo_(parseInt(this.scope_.game.jump_to, 10) + 1);
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
          if (ReviewCtrl.isMoveLine_(line)) {
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
 * @private
 */
ReviewCtrl.isMoveLine_ = function(pgnLine) {
  return !pgnLine.match(/\[/);  // Metadata is surrounded in square brackets
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
