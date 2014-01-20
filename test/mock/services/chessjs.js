'use strict';



/** @constructor */
var MockChessjsService = function() {
  return {
    util: {
      getOccupationColor: jasmine.createSpy('ChessUtil.getOccupationColor')
    },
    Chessjs: function() {
      this.prototype = {
        game_over: jasmine.createSpy('Chessjs.game_over'),
        load_pgn: jasmine.createSpy('Chessjs.load_pgn'),
        pgn: jasmine.createSpy('Chessjs.pgn'),
        move: jasmine.createSpy('Chessjs.move'),
        turn: jasmine.createSpy('Chessjs.turn'),
        get: jasmine.createSpy('Chessjs.get'),
        history: jasmine.createSpy('Chessjs.history'),
        undo: jasmine.createSpy('Chessjs.undo'),
        square_color: jasmine.createSpy('Chessjs.square_color'),
        header: jasmine.createSpy('Chessjs.header')
      };
    }
  };
};
