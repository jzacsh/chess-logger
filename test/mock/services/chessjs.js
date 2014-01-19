'use strict';



/** @constructor */
var MockChessjsService = function() {
  return {
    util: {
      getOccupationColor: jasmine.createSpy()
    },
    Chessjs: function() {
      this.prototype = {
        game_over: jasmine.createSpy(),
        load_pgn: jasmine.createSpy(),
        pgn: jasmine.createSpy(),
        move: jasmine.createSpy(),
        turn: jasmine.createSpy(),
        get: jasmine.createSpy(),
        history: jasmine.createSpy(),
        undo: jasmine.createSpy(),
        square_color: jasmine.createSpy(),
        header: jasmine.createSpy()
      };
    }
  };
};
