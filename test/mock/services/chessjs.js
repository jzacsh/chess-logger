'use strict';

/** @type {!Array.<string>} */
var mockChessjsMethods = [
  'game_over',
  'load_pgn',
  'pgn',
  'move',
  'turn',
  'get',
  'history',
  'undo',
  'square_color',
  'header',
];


var mockChessjsLib = {};
angular.forEach(mockChessjsMethods, function(method) {
  mockChessjsLib[method] = jasmine.createSpy('Chessjs.' + method);
});


/** @constructor */
var mockChessjsService = function() {
  return {
    util: {
      getOccupationColor: jasmine.createSpy('ChessUtil.getOccupationColor')
    },
    Chessjs: function() {
      return mockChessjsLib;
    }
  };
};
