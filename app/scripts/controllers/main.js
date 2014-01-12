'use strict';


/**
 * Main controller to manage a chess board and it's corresponding PGN data.
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.$q} $q
 * @constructor
 */
var Controller = function($scope, $q) {
  /** @private {!angular.$q} */
  this.q_ = $q;

  /** @private {!angular.Scope} */
  this.scope_ = $scope;

  /**
   * Promise to get a response from a user on what piece a pawn should be
   * promoted to.
   *
   * @type {?angular.$q.Deferred}
   */
  this.scope_.pawn_promotion = null;

  /** {@link Controller.htmlEntity_} */
  this.scope_.entity_to_piece = Controller.htmlEntity_;

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
 * @type {number}
 */
Controller.NumericEntityBlackOffset = 6;

/**
 * Map of SAN of pieces to their corresponding numeric value in HTML entities.
 *
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
 * Inverse of {@link Controller.WhiteChessPieceEntity}, without pawn.
 *
 * @enum {string}
 */
Controller.WhiteEntityToNotation = {
  9817: 'p',
  9814: 'r',
  9816: 'n',
  9815: 'b',
  9813: 'q',
  9812: 'k'
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
 * @param {string} piece
 * @param {boolean} forWhite
 * @return {number}
 * @private
 */
Controller.getNumericPieceEntity_ = function(piece, forWhite) {
  return Controller.WhiteChessPieceEntity[piece] +
    (forWhite ? 0 : Controller.NumericEntityBlackOffset);
};


/**
 * @param {number} entity
 * @param {boolean} forWhite
 * @return {string}
 */
Controller.getPieceFromNumericEntity = function(entity, forWhite) {
  var numericEntity = entity -
      (forWhite ? 0 : Controller.NumericEntityBlackOffset);
  return Controller.WhiteEntityToNotation[numericEntity];
};


/**
 * @param {?Controller.ChessjsPiece} chessPiece
 * @return {string}
 *     The HTML entity represented by {@code chessPiece}.
 * @private
 */
Controller.pieceToHtmlEntity_ = function(chessPiece) {
  if (chessPiece) {
    var numericEntity = Controller.getNumericPieceEntity_(
        chessPiece.type, chessPiece.color !== 'b');
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
 * @param {!Controller.AlgebraicCoordinate} coordinate
 * @return {string}
 * @private
 */
Controller.coordinateToSan_ = function(coordinate) {
  return coordinate.file + coordinate.rank;
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
 * @param {string} file
 * @param {number} rank
 */
Controller.prototype.moveTransition = function(file, rank) {
  var transitionState = this.getTransitionState(file, rank);
  if (this.pieceInTransit_ &&
      (transitionState === Controller.TransitionState.VALID ||
       transitionState === Controller.TransitionState.CANCEL)) {
    var destination = Controller.getAlgebraicCoordinate_(file, rank);
    this.maybeCompleteTransit_(destination).
        then(angular.bind(this, this.unsetPiecesInTransit_));
  } else if (transitionState === Controller.TransitionState.START) {
    this.pieceInTransit_ = Controller.getAlgebraicCoordinate_(file, rank);
  }
};


/**
 * Delets any metadata relating to pieces in transit.
 * @private
 */
Controller.prototype.unsetPiecesInTransit_ = function() {
  this.pieceInTransit_ = null;
  this.scope_.pawn_promotion = null;
};


/**
 * @param {!Controller.AlgebraicCoordinate} destination
 * @return {boolean}
 *     Whether a pawn is in transit and only one move away from promotion.
 * @private
 */
Controller.prototype.isPawnPromotion_ = function(destination) {
  var sanPieceInTransit = Controller.
      coordinateToSan_(this.pieceInTransit_ || {});
  var chessJsPiece = this.chessjs_.get(sanPieceInTransit);
  return !!this.pieceInTransit_ &&
         chessJsPiece.type === 'p' &&
         ((chessJsPiece.color === 'b' && destination.rank == 1) ||
          (chessJsPiece.color === 'w' && destination.rank == 8));
};


/**
 * @param {!Controller.AlgebraicCoordinate} destination
 * @return {!angular.Promise}
 *     Promise indicating completion (or incompletion) of transit.
 * @private
 */
Controller.prototype.maybeCompleteTransit_ = function(destination) {
  var deferred = this.q_.defer();
  if (Controller.pieceEquals(this.pieceInTransit_, destination)) {
    deferred.resolve();
    return deferred.promise;  // User is cancelling operation
  }

  if (this.isPawnPromotion_(destination)) {
    this.scope_.pawn_promotion = deferred;

    // Wait until user selects target promotion, before moving
    return this.scope_.pawn_promotion.promise.
        then(angular.bind(this, this.pawnPromtionHandler_, destination));
  } else {
    this.movePiece_(this.pieceInTransit_, destination);
    deferred.resolve();
    return deferred.promise;
  }
};


/**
 * @param {!Controller.AlgebraicCoordinate} destination
 * @param {*} response
 * @private
 */
Controller.prototype.pawnPromtionHandler_ = function(destination, response) {
  var isWhite = this.chessjs_.
      get(Controller.coordinateToSan_(this.pieceInTransit_)).
      color === 'w';

  var promoteTo = Controller.getPieceFromNumericEntity(response, isWhite);
  this.movePiece_(
      this.pieceInTransit_,
      destination,
      promoteTo  /* target promotion  */);
};


/** @return {!Array.<number>} */
Controller.prototype.getPossibleWhitePromotions = function() {
  return this.getPossiblePromotions_(true  /* white */);
};


/** @return {!Array.<number>} */
Controller.prototype.getPossibleBlackPromotions = function() {
  return this.getPossiblePromotions_(false  /* white */);
};


/**
 * @param {boolean} isForWhite
 * @return {!Array.<number>}
 * @private
 */
Controller.prototype.getPossiblePromotions_ = function(isForWhite) {
  var possiblePromotions = [];
  angular.forEach(
      ['n', 'r', 'q', 'b'],
      angular.bind(this, function(piece) {
        possiblePromotions.push(
            Controller.getNumericPieceEntity_(piece, isForWhite));
      }));
  return possiblePromotions;
};


/**
 * @param {!Controller.AlgebraicCoordinate} source
 * @param {!Controller.AlgebraicCoordinate} destination
 * @param {string=} opt_promotion
 *     SAN of the particular piece-type that should result of this promotion,
 *     if indeed this is a pawn-promotion.
 * @private
 */
Controller.prototype.movePiece_ = function(source, destination, opt_promotion) {
  var chessJsMove = {
    from: source.file + source.rank,
    to: destination.file + destination.rank
  };
  if (opt_promotion) {
    chessJsMove.promotion = opt_promotion;
  }
  this.chessjs_.move(chessJsMove);
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
  } else if (this.pieceExists_(file, rank) &&
             this.chessjs_.get(file + rank).color == this.chessjs_.turn()) {
    return Controller.TransitionState.START;
  } else {
    return Controller.TransitionState.INVALID;
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
    newline_char: '\n'
  });
};


angular.
  module('chessLoggerApp').
  controller('MainCtrl', [
    '$scope',
    '$q',
    Controller
  ]);
