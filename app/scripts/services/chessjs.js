'use strict';


var ChessUtil = {};

/** @return {!Array.<string> */
ChessUtil.getRanks = function() {
  return ChessUtil.BoardGrid.rank;
};


/** @return {!Array.<string> */
ChessUtil.getFiles = function() {
  return ChessUtil.BoardGrid.file;
};


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
ChessUtil.BoardGrid = {
  file: 'abcdefgh'.split(''),
  rank: '87654321'.split('')
};


/**
 * @param {!Object} chessjs
 * @return {string}
 */
ChessUtil.getGameResolution = function(chessjs) {
  var msgPrefix = 'Game Over: ';
  if (!chessjs || !chessjs.game_over()) {
    return '';
  } else if (chessjs.in_stalemate()) {
    return msgPrefix + 'Stalemate';
  } else if (chessjs.in_checkmate()) {
    return msgPrefix + 'Checkmate';
  } else if (chessjs.in_draw()) {
    return msgPrefix + 'Draw';
  }
};


/**
 * @param {!Object} chessjs
 * @param {string} file
 * @param {number} rank
 * @return {string}
 */
ChessUtil.getOccupationColor = function(chessjs, file, rank) {
  var occupation = chessjs.get(file + rank);
  return occupation ? occupation.color : '';
};


/**
 * @param {!Object} chessjs
 * @param {string} file
 * @param {number} rank
 * @return {string}
 */
ChessUtil.getCurrentPiece = function(chessjs, file, rank) {
  return ChessUtil.
      pieceToHtmlEntity_(chessjs.get(file + rank)) || '&#9816;';
};


/**
 * @param {?ChessUtil.ChessjsPiece} chessPiece
 * @return {string}
 *     The HTML entity represented by {@code chessPiece}.
 * @private
 */
ChessUtil.pieceToHtmlEntity_ = function(chessPiece) {
  if (chessPiece) {
    var numericEntity = ChessUtil.getNumericPieceEntity(
        chessPiece.type, chessPiece.color !== 'b');
    return ChessUtil.toHtmlEntity(numericEntity);
  }
  return '';
};


/**
 * @param {string} numericEntity
 * @return {string}
 *     The HTML entity (eg: &#40; for open parenthesis "(") that
 *     {@code numericEntity}'s number represents.
 */
ChessUtil.toHtmlEntity = function(numericEntity) {
  return '&#' + numericEntity + ';';
};


/**
 * @param {string} sanPiece
 * @param {boolean} forWhite
 * @return {number}
 */
ChessUtil.getNumericPieceEntity = function(sanPiece, forWhite) {
  return ChessUtil.WhiteChessPieceEntity[sanPiece] +
    (forWhite ? 0 : ChessUtil.NumericEntityBlackOffset);
};


/**
 * @param {number} entity
 * @param {boolean} forWhite
 * @return {string}
 */
ChessUtil.getPieceFromNumericEntity = function(entity, forWhite) {
  var numericEntity = entity -
      (forWhite ? 0 : ChessUtil.NumericEntityBlackOffset);
  return ChessUtil.WhiteEntityToNotation[numericEntity];
};


/**
 * @type {number}
 */
ChessUtil.NumericEntityBlackOffset = 6;


/**
 * Map of SAN of pieces to their corresponding numeric value in HTML entities.
 *
 * @enum {number}
 */
ChessUtil.WhiteChessPieceEntity = {
  p: 9817,
  r: 9814,
  n: 9816,
  b: 9815,
  q: 9813,
  k: 9812
};


/**
 * Inverse of {@link ChessUtil.WhiteChessPieceEntity}, without pawn.
 *
 * @enum {string}
 */
ChessUtil.WhiteEntityToNotation = {
  9817: 'p',
  9814: 'r',
  9816: 'n',
  9815: 'b',
  9813: 'q',
  9812: 'k'
};



/** @constructor */
var ChessjsService = function ChessjsService() {
  /** chess.js global, loaded before angular is */
  this.Chessjs = Chess;

  this.util = ChessUtil;
};


angular.
    module('chessLoggerApp').
    service('chessjsService', ChessjsService);
