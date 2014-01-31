'use strict';


/**
 * Record controller to manage a chess board and it's corresponding PGN data.
 *
 * @param {!angular.$location} $location
 * @param {!angular.$q} $q
 * @param {!angular.$routeParams} $routeParams
 * @param {!angular.Scope} $scope
 * @param {!Object} chessjsService
 *     github.com/jhlywa/chess.js
 * @param {!Object} historyService
 * @constructor
 */
var RecordCtrl = function RecordCtrl(
    $location, $q, $routeParams, $scope, chessjsService, historyService) {
  /** @private {!angular.$location} */
  this.location_ = $location;

  /** @private {!angular.$q} */
  this.q_ = $q;

  /** @private {!angular.$routeParams} */
  this.routeParams_ = $routeParams;

  /** @private {!angular.Scope} */
  this.scope_ = $scope;

  /** @private {!Object} */
  this.chessjsService_ = chessjsService;

  /**
   * Instance of chess.js game being represented on screen.
   *
   * @private {!Object}
   */
  // TODO(zacsh): Create a manual externs file for chess.js definitions?
  this.chessjs_ = new this.chessjsService_.Chessjs();

  /** @private {!Object} */
  this.historyService_ = historyService;

  /**
   * File and rank of the chess piece currently in transit, if any.
   *
   * <p>eg: 'a2' would White's knight at the start of the game.</p>
   *
   * @private {?RecordCtrl.AlgebraicCoordinate}
   */
  this.pieceInTransit_ = null;

  /**
   * Local data about the current game's UI state.
   * @type {!Object}
   */
  this.scope_.game = {
    /**
     * Promise to get a response from a user on what piece a pawn should be
     * promoted to.
     *
     * @type {?angular.$q.Deferred}
     */
    pawn_promotion: null,

    /** @type {!Object} */
    ui_board: this.chessjsService_.util,

    get_occupation_color: angular.
        bind(this, this.chessjsService_.util.getOccupationColor, this.chessjs_),

    get_current_piece: angular.
        bind(this, this.chessjsService_.util.getCurrentPiece, this.chessjs_)
  };

  /** @type {string} */
  this.scope_.white_name = this.historyService_.
      getMostRecentName(true  /* white */);

  /** @type {string} */
  this.scope_.black_name = this.historyService_.
      getMostRecentName(false  /* white */);

  /** @private {number} */
  this.gameKey_ = this.getGameKeyFromPath_();
  this.maybeLoadGame_();

  return $scope.controller = this;
};


/** @type {string} */
RecordCtrl.DownloadFileNamePrefix = 'chess.jzacsh.com_game-';


/**
 * @typedef {{file: string, rank: number}}
 */
RecordCtrl.AlgebraicCoordinate;


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
RecordCtrl.ChessjsPiece;


/**
 * Default PGN header data to populate when user is too lazy to fill in form,
 * before starting game.
 * @type {string}
 */
RecordCtrl.DefaultWhiteName = 'hippo';


/**
 * Default PGN header data to populate when user is too lazy to fill in form,
 * before starting game.
 * @type {string}
 */
RecordCtrl.DefaultBlackName = 'squirrel';


/**
 * @enum {string}
 */
RecordCtrl.TransitionState = {
  START: 'start',
  VALID: 'valid',
  INVALID: 'invalid',
  CANCEL: 'cancel'
};


/** @private */
RecordCtrl.prototype.maybeLoadGame_ = function() {
  if (!this.gameKey_) {
    return;
  }

  var requestedPgn = this.historyService_.readPgnDumps()[this.gameKey_];
  if (!requestedPgn) {
    // TODO(zacsh): Notify user that key wasn't found.
    this.location_.path('/history');
    return;
  }

  this.chessjs_.load_pgn(requestedPgn);

  // Don't allow editing of past games.
  if (this.chessjs_.game_over()) {
    this.location_.path('/review:' + this.gameKey_);
    return;
  }
};


/**
 * @return {string}
 *     Download-file name for a PGN dump of the current game.
 */
RecordCtrl.prototype.getDownloadFileName = function() {
  return RecordCtrl.DownloadFileNamePrefix + this.gameKey_ + '.txt';
};


/** Authenticate against 3rd party API. */
RecordCtrl.prototype.login = function() {
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
RecordCtrl.prototype.pieceExists_ = function(file, rank) {
  return !!this.chessjs_.get(file + rank);
};


/**
 * @param {string} file
 * @param {number} rank
 * @return {!RecordCtrl.AlgebraicCoordinate}
 * @private
 */
RecordCtrl.getAlgebraicCoordinate_ = function(file, rank) {
  return {file: file, rank: rank};
};


/**
 * @param {!RecordCtrl.AlgebraicCoordinate} coordinate
 * @return {string}
 * @private
 */
RecordCtrl.coordinateToSan_ = function(coordinate) {
  return coordinate.file + coordinate.rank;
};


/**
 * @param {string} file
 * @param {number} rank
 * @return {boolean}
 *     If piece is currently being moved to another square.
 */
RecordCtrl.prototype.isPendingTransition = function(file, rank) {
  return this.pieceInTransit_ &&
         RecordCtrl.pieceEquals(
             this.pieceInTransit_,
             RecordCtrl.getAlgebraicCoordinate_(file, rank));
};


/**
 * @param {!RecordCtrl.AlgebraicCoordinate} pieceA
 * @param {!RecordCtrl.AlgebraicCoordinate} pieceB
 * @return {boolean}
 *     Whether {@code pieceA} is the same square as {@code pieceB}.
 */
RecordCtrl.pieceEquals = function(pieceA, pieceB) {
  return pieceA.file === pieceB.file &&
         pieceA.rank === pieceB.rank;
};


/**
 * Either starts or completes transition of a piece from one square to another.
 *
 * If a move is already not underway, then {@code file} and {@code rank}
 * indicate the piece to be moved. If a move is already underway, or a "piece
 * is in transit", the {@code file} and {@code rank} indicates the square the
 * current user wishes to move their piece.
 *
 * @param {string} file
 * @param {number} rank
 */
RecordCtrl.prototype.moveTransition = function(file, rank) {
  var transitionState = this.getTransitionState(file, rank);
  if (this.pieceInTransit_ &&
      (transitionState === RecordCtrl.TransitionState.VALID ||
       transitionState === RecordCtrl.TransitionState.CANCEL)) {

    if (transitionState === RecordCtrl.TransitionState.CANCEL) {
      this.unsetPiecesInTransit_();  // User is cancelling operation
    } else {
      // Allows user to start game by simply moving a piece on board (ignoring
      // annoying form fields).
      if (!this.gameStarted()) {
        this.startNewGame();
      }

      var destination = RecordCtrl.getAlgebraicCoordinate_(file, rank);
      this.maybeCompleteTransit_(destination).
          then(angular.bind(this, this.unsetPiecesInTransit_));
    }
  } else if (transitionState === RecordCtrl.TransitionState.START) {
    this.pieceInTransit_ = RecordCtrl.getAlgebraicCoordinate_(file, rank);
  }
};


/**
 * Delets any metadata relating to pieces in transit.
 * @private
 */
RecordCtrl.prototype.unsetPiecesInTransit_ = function() {
  this.pieceInTransit_ = null;
  this.scope_.game.pawn_promotion = null;
};


/**
 * @param {!RecordCtrl.AlgebraicCoordinate} destination
 * @return {boolean}
 *     Whether the piece completing transit to {@code destination} is a pawn
 *     and said destination indicates a promotion.
 * @private
 */
RecordCtrl.prototype.isPawnPromotion_ = function(destination) {
  var sanPieceInTransit = RecordCtrl.
      coordinateToSan_(this.pieceInTransit_ || {});
  var chessJsPiece = this.chessjs_.get(sanPieceInTransit);
  return !!(this.pieceInTransit_ && chessJsPiece.type === 'p') &&
         ((chessJsPiece.color === 'b' && destination.rank == 1) ||
          (chessJsPiece.color === 'w' && destination.rank == 8));
};


/**
 * @param {!RecordCtrl.AlgebraicCoordinate} destination
 * @return {!angular.Promise}
 *     Promise indicating completion (or incompletion) of transit.
 * @private
 */
RecordCtrl.prototype.maybeCompleteTransit_ = function(destination) {
  var deferred = this.q_.defer();
  if (this.isPawnPromotion_(destination)) {
    this.scope_.game.pawn_promotion = deferred;

    // Wait until user selects target promotion, before moving
    return this.scope_.game.pawn_promotion.promise.
        then(angular.bind(this, this.pawnPromtionHandler_, destination));
  } else {
    this.movePiece_(this.pieceInTransit_, destination);
    deferred.resolve();
    return deferred.promise;
  }
};


/**
 * @param {!RecordCtrl.AlgebraicCoordinate} destination
 * @param {*} response
 * @private
 */
RecordCtrl.prototype.pawnPromtionHandler_ = function(destination, response) {
  var isWhite = this.chessjs_.
      get(RecordCtrl.coordinateToSan_(this.pieceInTransit_)).
      color === 'w';

  var promoteTo = this.scope_.game.ui_board.
      getPieceFromNumericEntity(response, isWhite);
  this.movePiece_(
      this.pieceInTransit_,
      destination,
      promoteTo  /* target promotion  */);
};


/** @return {!Array.<number>} */
RecordCtrl.prototype.getPossibleWhitePromotions = function() {
  return this.getPossiblePromotions_(true  /* white */);
};


/** @return {!Array.<number>} */
RecordCtrl.prototype.getPossibleBlackPromotions = function() {
  return this.getPossiblePromotions_(false  /* white */);
};


/**
 * @param {boolean} isForWhite
 * @return {!Array.<number>}
 * @private
 */
RecordCtrl.prototype.getPossiblePromotions_ = function(isForWhite) {
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
 * @param {!RecordCtrl.AlgebraicCoordinate} source
 * @param {!RecordCtrl.AlgebraicCoordinate} destination
 * @param {string=} opt_promotion
 *     SAN of the particular piece-type that should result of this promotion,
 *     if indeed this is a pawn-promotion.
 * @private
 */
RecordCtrl.prototype.movePiece_ = function(source, destination, opt_promotion) {
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
RecordCtrl.prototype.turn = function() {
  return this.turnColor() == 'w' ? 'White' : 'Black';
};


/**
 * @return {string}
 *    chess.js's {@link #turn} output expanded to "White" or "Black".
 */
RecordCtrl.prototype.turnColor = function() {
  return this.chessjs_.turn();
};


/**
 * @param {string} file
 * @param {number} rank
 * @return {?RecordCtrl.TransitionState}
 *    null if there is no piece occupying the square to report a transition
 *    state for.
 */
RecordCtrl.prototype.getTransitionState = function(file, rank) {
  var square = RecordCtrl.getAlgebraicCoordinate_(file, rank);
  if (this.pieceInTransit_) {
    if (RecordCtrl.pieceEquals(this.pieceInTransit_, square)) {
      return RecordCtrl.TransitionState.CANCEL;
    } else {
      return RecordCtrl.TransitionState.VALID;
    }
  } else if (this.pieceExists_(file, rank) &&
             this.chessjs_.get(file + rank).color == this.chessjs_.turn()) {
    return RecordCtrl.TransitionState.START;
  } else {
    return RecordCtrl.TransitionState.INVALID;
  }

  return null;  // empty square, no transition
};


/**
 * @return {boolean}
 *     Whether the last move put opponent in check.
 */
RecordCtrl.prototype.wasCheck = function() {
  return !!(this.chessjs_.history().length &&
            this.chessjs_.history().pop().match(/\+/));
};


/**
 * @param {string} file
 * @param {number} rank
 * @return {string}
 */
RecordCtrl.prototype.getMoveTransitionStateMessage = function(file, rank) {
  var transitionState = this.getTransitionState(file, rank);
  if (transitionState === null) {
    return '';
  }

  switch (transitionState) {
      case RecordCtrl.TransitionState.CANCEL:
        return 'Cancels move';

      case RecordCtrl.TransitionState.VALID:
        return 'Sets piece on ' + file + rank +
            ', from ' + this.pieceInTransit_.file + this.pieceInTransit_.rank;

      case RecordCtrl.TransitionState.START:
        return 'Starts move of piece ' + file + rank;

      case RecordCtrl.TransitionState.INVALID:
        return 'Invalid start; currently ' + this.turn() + "'s turn to move.";

      default:
        throw new Error(
            'Unexpected transition state, "' + transitionState +
            '", generated from coordinates: "' + (file + rank) + '".');
  }
};


/** Chess.js {@link #undo} */
RecordCtrl.prototype.undo = function() {
  this.chessjs_.undo();
};


/** @return {boolean} */
RecordCtrl.prototype.gameStarted = function() {
  return !!this.gameKey_;
};


/** @return {boolean} */
RecordCtrl.prototype.gameInProgress = function() {
  return this.gameStarted() && !!this.chessjs_.history().length;
};


/** @return {string} */
RecordCtrl.prototype.getGameResolution = function() {
  return this.chessjsService_.util.getGameResolution(this.chessjs_);
};


/**
 * @param {string} file
 * @param {number} rank
 * @return {string}
 *     "light" or "dark" as per underlying chess.js {@link #square_color}.
 */
RecordCtrl.prototype.squareColor = function(file, rank) {
  return this.chessjs_.square_color(file + rank);
};


/**
 * @return {string}
 *     Chess.js {@link #pgn}.
 */
RecordCtrl.prototype.toPgn = function() {
  var pgnDump = this.chessjs_.pgn({
    max_width: 5
  });

  if (this.gameInProgress()) {
    // Start recording dumps, once a game has started.
    this.historyService_.writePgnDump(this.gameKey_, pgnDump);

    // If this is the first save, head to the permalink of this game.
    if (!this.getGameKeyFromPath_()) {
      this.location_.path('/record:' + this.gameKey_);
    }
  }

  return pgnDump;
};


/**
 * @return {number}
 * @private
 */
RecordCtrl.prototype.getGameKeyFromPath_ = function() {
  var gameKey = this.routeParams_.gamekey.replace(/^:/, '');

  if (gameKey.match(/^\d+$/)) {
    return parseInt(gameKey, 10);
  } else {
    // TODO(zacsh): Consider temporary message explaining invlaid gamekey as
    // reason for redirect
    this.location_.path('/record:0');
  }
};


/**
 * Logs the game and some metadata in history.
 */
RecordCtrl.prototype.startNewGame = function() {
  this.gameKey_ = HistoryService.newGameKey();

  if (this.scope_.white_name) {
    this.historyService_.setMostRecentName(
        this.scope_.white_name, true  /* for white */);
  } else {
    this.scope_.white_name = RecordCtrl.DefaultWhiteName;
  }
  this.chessjs_.header('White', this.scope_.white_name);

  if (this.scope_.black_name) {
    this.historyService_.setMostRecentName(
        this.scope_.black_name, false  /* for white */);
  } else {
    this.scope_.black_name = RecordCtrl.DefaultBlackName;
  }
  this.chessjs_.header('Black', this.scope_.black_name);

  this.chessjs_.header('Date', HistoryService.buildDateHeader(this.gameKey_));
};


/**
 * @return {boolean}
 *     Whether any unfinished games are saved in history.
 */
RecordCtrl.prototype.haveUnfinishedGame = function() {
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
  controller('RecordCtrl', [
    '$location',
    '$q',
    '$routeParams',
    '$scope',
    'chessjsService',
    'historyService',
    RecordCtrl
  ]);
