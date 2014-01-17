'use strict';


/**
 * Main controller to manage a chess board and it's corresponding PGN data.
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.$q} $q
 * @param {!Object} chessjsService
 *     github.com/jhlywa/chess.js
 * @param {!Object} historyService
 * @constructor
 */
var Controller = function Controller(
    $scope, $q, chessjsService, historyService) {
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

  /** @private {!Object} */
  this.chessjsService_ = chessjsService;

  /** {@link Controller.htmlEntity} */
  this.scope_.entity_to_piece = this.chessjsService_.util.toHtmlEntity;

  /**
   * Instance of chess.js game being represented on screen.
   *
   * @private {!Object}
   */
  // TODO(zacsh): Create a manual externs file for chess.js definitions?
  this.chessjs_ = new this.chessjsService_.Chessjs();

  /** @private {!Object} */
  this.historyService_ = historyService;

  /** @type {string} */
  this.scope_.white_name = this.historyService_.
      getMostRecentName(true  /* white */);

  /** @type {string} */
  this.scope_.black_name = this.historyService_.
      getMostRecentName(false  /* white */);

  /** @type {!Object} */
  this.scope_.ui_board = this.chessjsService_.util;

  /**
   * File and rank of the chess piece currently in transit, if any.
   *
   * <p>eg: 'a2' would White's knight at the start of the game.</p>
   *
   * @private {?Controller.AlgebraicCoordinate}
   */
  this.pieceInTransit_ = null;

  /** @private {number} */
  this.gameKey_ = 0;

  this.getOccupationColor = angular.
      bind(this, this.chessjsService_.util.getOccupationColor, this.chessjs_);

  this.getCurrentPiece = angular.
      bind(this, this.chessjsService_.util.getCurrentPiece, this.chessjs_);

  return $scope.controller = this;
};


/**
 * @typedef {{file: string, rank: number}}
 */
Controller.AlgebraicCoordinate;


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
 * Default PGN header data to populate when user is too lazy to fill in form,
 * before starting game.
 * @type {string}
 */
Controller.DefaultWhiteName = 'hippo';


/**
 * Default PGN header data to populate when user is too lazy to fill in form,
 * before starting game.
 * @type {string}
 */
Controller.DefaultBlackName = 'squirrel';


/**
 * @enum {string}
 */
Controller.TransitionState = {
  START: 'start',
  VALID: 'valid',
  INVALID: 'invalid',
  CANCEL: 'cancel'
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
    this.initNewGame_();
    var destination = Controller.getAlgebraicCoordinate_(file, rank);
    this.maybeCompleteTransit_(destination).
        then(angular.bind(this, this.unsetPiecesInTransit_));
  } else if (transitionState === Controller.TransitionState.START) {
    this.pieceInTransit_ = Controller.getAlgebraicCoordinate_(file, rank);
  }
};


/**
 * Initializes a new game, if one hasnt' already been created to save the
 * current moves.
 * @private
 */
Controller.prototype.initNewGame_ = function() {
  if (!this.gameStarted()) {
    this.newGame();
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
    deferred.reject();
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
            this.chessjsService_.util.getNumericPieceEntity(piece, isForWhite));
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
  return !!(this.chessjs_.history().length &&
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


/** @return {boolean} */
Controller.prototype.gameStarted = function() {
  return !!this.gameKey_;
};


/** @return {string} */
Controller.prototype.getGameResolution = function() {
  return this.chessjsService_.util.getGameResolution(this.chessjs_);
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
  var pgnDump = this.chessjs_.pgn({
    max_width: 5,
    newline_char: '\n'
  });

  if (this.gameStarted() && this.chessjs_.history().length) {
    // Start recording dumps, once a game has started.
    this.historyService_.writePgnDump(this.gameKey_, pgnDump);
  }

  return pgnDump;
};


/**
 *
 */
Controller.prototype.newGame = function() {
  var now = new Date();

  if (this.scope_.white_name) {
    this.historyService_.setMostRecentName(
        this.scope_.white_name, true  /* for white */);
  } else {
    this.scope_.white_name = Controller.DefaultWhiteName;
  }
  this.chessjs_.header('White', this.scope_.white_name);

  if (this.scope_.black_name) {
    this.historyService_.setMostRecentName(
        this.scope_.black_name, false  /* for white */);
  } else {
    this.scope_.black_name = Controller.DefaultBlackName;
  }
  this.chessjs_.header('Black', this.scope_.black_name);

  var iso8601Date = [
    now.getUTCFullYear(),
    (now.getUTCMonth() + 1),
    now.getUTCDate()
  ].join('-');
  this.chessjs_.header('Date', iso8601Date);

  this.gameKey_ = now.getTime();
};


/**
 * @return {boolean}
 *     Whether any unfinished games are saved in history.
 */
Controller.prototype.haveUnfinishedGame = function() {
  if (this.gameStarted()) {
    // Only trigger this prompt when a game hasn't been started.
    return false;
  }

  var found = false;

  var testGame;
  angular.forEach(
      this.historyService_.readPgnDumps(),
      angular.bind(this, function(pgnDump, gameKey) {
        if (!found) {
          testGame = new this.chessjsService_.Chessjs();
          testGame.load_pgn(pgnDump);
          found = !testGame.game_over();
        }
      }));
  return found;
};


angular.
  module('chessLoggerApp').
  controller('MainCtrl', [
    '$scope',
    '$q',
    'chessjsService',
    'historyService',
    Controller
  ]);
