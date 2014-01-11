'use strict';


/**
 * Main controller to manage a chess board and it's corresponding PGN data.
 *
 * @param {!angular.Scope} $scope
 * @constructor
 */
var Controller = function($scope) {
  /**
   * Instance of chess.js game being represented on screen.
   *
   * @private {!Object}
   */
  // TODO(zacsh): Create a manual externs file for chess.js definitions?
  this.chessjs_ = new Chess();

  /**
   * File and rank of the chess piece currently in transit, if any.
   *
   * <p>eg: 'a2' would White's knight at the start of the game.</p>
   *
   * @private {?Controller.AlgebraicCoordinate}
   */
  this.pieceInTransit_ = null;

  /** @type {!Controller.BoardGrid} */
  $scope.ui_board = angular.copy(Controller.BoardGrid);
  $scope.ui_board.rank.reverse();


  return $scope.controller = this;
};


/**
 * @typedef {{file: string, rank: number}}
 */
Controller.AlgebraicCoordinate;


/**
 * Static data describing any chess board's algebraic notation.
 *
 * File represents the horizontal transition a piece can make left and right
 * of each player. Rank represents the vertical progress a piece can make to
 * and from each player.
 *
 * @typedef {{
 *     file: !Array.<string>,
 *     rank: !Array.<number>
 *     }}
 */
Controller.BoardGrid = {
  file: 'abcdefgh'.split(''),
  rank: '12345678'.split('')
};


/**
 * chess.js representation of what could be currently occupying a square on the
 * board, such that:
 * - "type" property is the piece itself in lower-cased algebraic notation (eg:
 *   "n" for knight, "k" for king).
 * - "color" property is either "b" for black or "w" for white.
 *
 * See: https://github.com/jhlywa/chess.js#getsquare
 *
 * @typedef {?{
 *     type: string,
 *     color: string
 *     }}
 */
Controller.ChessjsPiece;


/**
 * @enum {number}
 */
Controller.WhiteChessPieceEntity = {
  p: 9817,
  r: 9814,
  n: 9816,
  b: 9815,
  q: 9813,
  k: 9812
};


/**
 * @enum {string}
 */
Controller.TransitionState = {
  START: 'start',
  VALID: 'valid',
  INVALID: 'invalid',
  CANCEL: 'cancel'
};


/**
 * @param {string} numericEntity
 * @return {string}
 *     The HTML entity (eg: &#40; for open parenthesis "(") that
 *     {@code numericEntity}'s number represents.
 * @private
 */
Controller.htmlEntity_ = function(numericEntity) {
  return '&#' + numericEntity + ';';
};


/**
 * @param {?Controller.ChessjsPiece} chessPiece
 * @return {string}
 *     The HTML entity represented by {@code chessPiece}.
 * @private
 */
Controller.pieceToHtmlEntity_ = function(chessPiece) {
  if (chessPiece) {
    var numericEntity = Controller.WhiteChessPieceEntity[chessPiece.type] +
        (chessPiece.color == 'b' ? 6 : 0);
    return Controller.htmlEntity_(numericEntity);
  }
  return '';
};


/**
 * @param {string} file
 * @param {number} rank
 * @return {string}
 */
Controller.prototype.getCurrentPiece = function(file, rank) {
  return Controller.
      pieceToHtmlEntity_(this.chessjs_.get(file + rank)) || '&nbsp;';
};


/**
 * @param {string} file
 * @param {number} rank
 * @return {string}
 */
Controller.prototype.getOccupationColor = function(file, rank) {
  var occupation = this.chessjs_.get(file + rank);
  return occupation ? occupation.color : '';
};


/** Download current PGN output. */
Controller.prototype.download = function() {
  throw new Error('`download` not yet implemented');
};


/** Authenticate against 3rd party API. */
Controller.prototype.login = function() {
  throw new Error('`login` not yet implemented');
};


/**
 * @param {string} file
 * @param {number} rank
 * @return {boolean}
 *     Whether a piece is currently occupying a space on the board at the given
 *     {@code file} and {@code rank}.
 * @private
 */
Controller.prototype.pieceExists_ = function(file, rank) {
  return !!this.chessjs_.get(file + rank);
};


/**
 * @param {string} file
 * @param {number} rank
 * @return {!Controller.AlgebraicCoordinate}
 * @private
 */
Controller.getAlgebraicCoordinate_ = function(file, rank) {
  return {file: file, rank: rank};
};


/**
 * @param {string} file
 * @param {number} rank
 * @return {boolean}
 *     If piece is currently being moved to another square.
 */
Controller.prototype.isPendingTransition = function(file, rank) {
  return this.pieceInTransit_ &&
         Controller.pieceEquals(
             this.pieceInTransit_,
             Controller.getAlgebraicCoordinate_(file, rank));
};


/**
 * @param {string} file
 * @param {number} rank
 */
Controller.prototype.moveTransition = function(file, rank) {
  if (this.pieceInTransit_) {
    this.maybeMovePiece_(
        this.pieceInTransit_,  // source
        Controller.getAlgebraicCoordinate_(file, rank)  /* destination */);
    this.pieceInTransit_ = null;
  } else if (this.pieceExists_(file, rank)) {
    this.pieceInTransit_ = Controller.getAlgebraicCoordinate_(file, rank);
  }
};


/**
 * @param {!Controller.AlgebraicCoordinate} pieceA
 * @param {!Controller.AlgebraicCoordinate} pieceB
 * @return {boolean}
 *     Whether {@code pieceA} is the same square as {@code pieceB}.
 */
Controller.pieceEquals = function(pieceA, pieceB) {
  return pieceA.file === pieceB.file &&
         pieceA.rank === pieceB.rank;
};


/**
 * @param {!Controller.AlgebraicCoordinate} source
 * @param {!Controller.AlgebraicCoordinate} destination
 * @private
 */
Controller.prototype.maybeMovePiece_ = function(source, destination) {
  if (Controller.pieceEquals(source, destination)) {
    return;  // User is cancelling operation
  }

  this.chessjs_.move({
    from: source.file + source.rank,
    to: destination.file + destination.rank
  });
};


/**
 * @return {string}
 *    chess.js's {@link #turn} output expanded to "White" or "Black".
 */
Controller.prototype.turn = function() {
  return this.turnColor() == 'w' ? 'White' : 'Black';
};


/**
 * @return {string}
 *    chess.js's {@link #turn} output expanded to "White" or "Black".
 */
Controller.prototype.turnColor = function() {
  return this.chessjs_.turn();
};


/**
 * @param {string} file
 * @param {number} rank
 * @return {?Controller.TransitionState}
 *    null if there is no piece occupying the square to report a transition
 *    state for.
 */
Controller.prototype.getTransitionState = function(file, rank) {
  var square = Controller.getAlgebraicCoordinate_(file, rank);
  if (this.pieceInTransit_) {
    if (Controller.pieceEquals(this.pieceInTransit_, square)) {
      return Controller.TransitionState.CANCEL;
    } else {
      return Controller.TransitionState.VALID;
    }
  } else if (this.pieceExists_(file, rank)) {
    if (this.chessjs_.get(file + rank) &&
        this.chessjs_.get(file + rank).color == this.chessjs_.turn()) {
      return Controller.TransitionState.START;
    } else {
      return Controller.TransitionState.INVALID;
    }
  }

  return null;  // empty square, no transition
};


/**
 * @return {boolean}
 *     Whether the last move put opponent in check.
 */
Controller.prototype.wasCheck = function() {
  return !!(this.moveCount() &&
            this.chessjs_.history().pop().match(/\+/));
};


/**
 * @param {string} file
 * @param {number} rank
 * @return {string}
 */
Controller.prototype.getMoveTransitionStateMessage = function(file, rank) {
  var transitionState = this.getTransitionState(file, rank);
  if (transitionState === null) {
    return '';
  }

  switch (transitionState) {
      case Controller.TransitionState.CANCEL:
        return 'Cancels move';

      case Controller.TransitionState.VALID:
        return 'Sets piece on ' + file + rank +
            ', from ' + this.pieceInTransit_.file + this.pieceInTransit_.rank;

      case Controller.TransitionState.START:
        return 'Starts move of piece ' + file + rank;

      case Controller.TransitionState.INVALID:
        return 'Invalid start; currently ' + this.turn() + "'s turn to move.";

      default:
        throw new Error(
            'Unexpected transition state, "' + transitionState +
            '", generated from coordinates: "' + (file + rank) + '".');
  }
};


/** Chess.js {@link #undo} */
Controller.prototype.undo = function() {
  this.chessjs_.undo();
};


/**
 * @return {number}
 *     Number of moves in chess.js {@link #history}.
 */
Controller.prototype.moveCount = function() {
  return this.chessjs_.history().length;
};


/** @return {string} */
Controller.prototype.getGameResolution = function() {
  var msgPrefix = 'Game Over: ';
  if (!this.chessjs_ || !this.chessjs_.game_over()) {
    return '';
  } else if (this.chessjs_.in_stalemate()) {
    return msgPrefix + 'Stalemate';
  } else if (this.chessjs_.in_checkmate()) {
    return msgPrefix + 'Checkmate';
  } else if (this.chessjs_.in_draw()) {
    return msgPrefix + 'Draw';
  }
};


/**
 * @param {string} file
 * @param {number} rank
 * @return {string}
 *     "light" or "dark" as per underlying chess.js {@link #square_color}.
 */
Controller.prototype.squareColor = function(file, rank) {
  return this.chessjs_.square_color(file + rank);
};


/**
 * @return {string}
 *     Chess.js {@link #pgn}.
 */
Controller.prototype.toPgn = function() {
  return this.chessjs_.pgn({
    max_width: 5,
    newline_char: "\n"
  });
};


angular.
  module('chessLoggerApp').
  controller('MainCtrl', [
    '$scope',
    Controller
  ]);
