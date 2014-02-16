'use strict';


var ChessUtil = {};


/**
 * HTML entity used to populate empty squares no chessboard, to fill space.
 * @type {string}
 */
ChessUtil.EmptySquareHack = '&#9816;';


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
 * @param {string} numericEntity
 * @return {string}
 *     The HTML entity (eg: &#40; for open parenthesis "(") that
 *     {@code numericEntity}'s number represents.
 */
ChessUtil.toHtmlEntity = function(numericEntity) {
  return '&#' + numericEntity + ';';
};


/**
 * @param {!Object} chessjs
 * @param {string} file
 * @param {number} rank
 * @return {string}
 */
ChessUtil.getCurrentPiece = function(chessjs, file, rank) {
  return ChessUtil.
      pieceToHtmlEntity_(chessjs.get(file + rank)) || ChessUtil.EmptySquareHack;
};


/**
 * @param {function(string) : void} callback
 */
ChessUtil.forEachSquare = function(callback) {
  for (var rank = 1; rank <= 8; ++rank) {
    'abcdefgh'.split('').forEach(function(file) {
      callback(String(file + rank));
    });
  }
};


/**
 * @enum {number}
 */
ChessUtil.RelativePieceValue = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9
};


/**
 * @param {!Object} chessjs
 * @return {{w: number, b: number}}
 *     Combined relative value of every chess-piece for both players at current
 *     point in {@code chessjs} game.
 */
ChessUtil.getTotalRelativeValues = function(chessjs) {
  var valuations = {w: 0, b: 0};
  ChessUtil.forEachSquare(function(coordinate) {
    var occupation = chessjs.get(coordinate);
    if (occupation && occupation.type !== 'k') {
      if (!ChessUtil.RelativePieceValue[occupation.type]) {
        throw new Error(
            'RelativePieceValue missing property: "' + occupation.type + '".');
      }
      valuations[occupation.color] += ChessUtil.
          RelativePieceValue[occupation.type];
    }
  });
  return valuations;
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



/**
 * @param {string} pgnDump
 * @return {string}
 *     "Date" header of {@code pgnDump}.
 */
// TODO(zacsh): now I have two problems. come up with non-linebreak dependent
// logic.
ChessUtil.getDate = function(pgnDump) {
  var date = '';
  var pgnLines = pgnDump.split('\n');
  angular.forEach(pgnLines, function(line, index) {
    if (date || !line.match(/\[(\s*)?date/i)) {
      return;
    }
    var dateMatch = line.match(/(\d\d\d\d\.\d\d\.\d\d)/);
    date = dateMatch ? dateMatch[1] : '';
  });
  return date;
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
