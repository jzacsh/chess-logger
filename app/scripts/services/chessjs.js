'use strict';



/**
 * @constructor
 */
var ChessjsService = function ChessjsService() {
  /** chess.js global, loaded before angular is */
  this.Chessjs = Chess;

  this.getGameResolution = ChessjsService.getGameResolution;
};


/**
 * @param {!Object} chessjs
 * @return {string}
 */
ChessjsService.getGameResolution = function(chessjs) {
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


angular.
    module('chessLoggerApp').
    service('chessjsService', ChessjsService);
