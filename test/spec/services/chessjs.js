'use strict';

var TEST_CHESS_GLOBAL = 5;

var Chess = TEST_CHESS_GLOBAL;

describe('Service: chessjsService', function() {
  var chessjsService, util;
  beforeEach(function() {
    module('chessLoggerApp');
    inject(function(_chessjsService_) {
      chessjsService = _chessjsService_;
    });
    expect(chessjsService).toBeDefined();

    util = chessjsService.util;
  });

  it('should save `Chess` found in global scope', function() {
    expect(chessjsService.Chessjs).toBe(TEST_CHESS_GLOBAL);
  });

  it('should provide `util` package in service', function() {
    expect(chessjsService.util).toBeDefined();
  });

  it('should provide reverse map of pieces to HTML entities', function() {
    expect(Object.keys(util.WhiteChessPieceEntity).length).toBeGreaterThan(0);
    angular.forEach(util.WhiteChessPieceEntity, function(entity, piece) {
      expect(util.WhiteEntityToNotation[entity]).toBe(piece);
    });
  });

  it('should provide top-left to bottom-right grid of file & rank', function() {
    expect(util.getRanks().length).toBeGreaterThan(0);
    expect(util.getRanks().length).toBe(util.getFiles().length);

    angular.forEach(util.getRanks(), function(rank, index) {
      switch (index) {
        case 0:
          expect(rank).toBe('8');
          break;
        case 1:
          expect(rank).toBe('7');
          break;
        case 2:
          expect(rank).toBe('6');
          break;
        case 3:
          expect(rank).toBe('5');
          break;
        case 4:
          expect(rank).toBe('4');
          break;
        case 5:
          expect(rank).toBe('3');
          break;
        case 6:
          expect(rank).toBe('2');
          break;
        case 7:
          expect(rank).toBe('1');
          break;
      }
    });

    angular.forEach(util.getFiles(), function(file, index) {
      switch (index) {
        case 0:
          expect(file).toBe('a');
          break;
        case 1:
          expect(file).toBe('b');
          break;
        case 2:
          expect(file).toBe('c');
          break;
        case 3:
          expect(file).toBe('d');
          break;
        case 4:
          expect(file).toBe('e');
          break;
        case 5:
          expect(file).toBe('f');
          break;
        case 6:
          expect(file).toBe('g');
          break;
        case 7:
          expect(file).toBe('h');
          break;
      }
    });
  });

  it('should get game resolution', function() {
    var gameOver = false,
        stalemate = false,
        checkmate = false,
        draw = false;

    var chessSpy = {
      game_over: jasmine.createSpy().andCallFake(function() {
        return gameOver;
      }),
      in_stalemate: jasmine.createSpy().andCallFake(function() {
        return stalemate;
      }),
      in_checkmate: jasmine.createSpy().andCallFake(function() {
        return checkmate;
      }),
      in_draw: jasmine.createSpy().andCallFake(function() {
        return draw;
      })
    };

    expect(util.getGameResolution(null)).toBe('');
    expect(util.getGameResolution(chessSpy)).toBe('');

    gameOver = true;

    stalemate = true;
    expect(util.getGameResolution(chessSpy)).toBe('Game Over: Stalemate');
    stalemate = false;

    checkmate = true;
    expect(util.getGameResolution(chessSpy)).toBe('Game Over: Checkmate');
    checkmate = false;

    draw = true;
    expect(util.getGameResolution(chessSpy)).toBe('Game Over: Draw');
    draw = false;
  });

  it('should convert a numeric into HTML entity format', function() {
    expect(util.toHtmlEntity(40)).toBe('&#40;');
    expect(util.toHtmlEntity('40')).toBe('&#40;');

    expect(util.toHtmlEntity(0)).toBe('&#0;');
    expect(util.toHtmlEntity('0')).toBe('&#0;');
  });

  it('should get occupation color', function() {
    var chessSpy = {
      get: jasmine.createSpy().andReturn(false)
    };
    var testFile = 'a';
    var testRank = '3';

    expect(util.getOccupationColor(chessSpy, testFile, testRank)).toBe('');
    expect(chessSpy.get).toHaveBeenCalledWith(testFile + testRank);

    chessSpy.get = jasmine.createSpy().andReturn({color: 'b'});
    expect(util.getOccupationColor(chessSpy, testFile, testRank)).toBe('b');
    expect(chessSpy.get).toHaveBeenCalledWith(testFile + testRank);

    chessSpy.get = jasmine.createSpy().andReturn({color: 'w'});
    expect(util.getOccupationColor(chessSpy, testFile, testRank)).toBe('w');
    expect(chessSpy.get).toHaveBeenCalledWith(testFile + testRank);
  });

  it('should get numeric entity any piece', function() {
    expect(util.getNumericPieceEntity('k', true)).toBe(9812);
    expect(util.getNumericPieceEntity('q', true)).toBe(9813);
    expect(util.getNumericPieceEntity('r', true)).toBe(9814);
    expect(util.getNumericPieceEntity('b', true)).toBe(9815);
    expect(util.getNumericPieceEntity('n', true)).toBe(9816);
    expect(util.getNumericPieceEntity('p', true)).toBe(9817);

    expect(util.getNumericPieceEntity('k', false)).toBe(9818);
    expect(util.getNumericPieceEntity('q', false)).toBe(9819);
    expect(util.getNumericPieceEntity('r', false)).toBe(9820);
    expect(util.getNumericPieceEntity('b', false)).toBe(9821);
    expect(util.getNumericPieceEntity('n', false)).toBe(9822);
    expect(util.getNumericPieceEntity('p', false)).toBe(9823);
  });

  it('should get HTML entity of the current piece', function() {
    var testData = {currentPiece: null};
    var chessSpy = {
      get: jasmine.createSpy().andCallFake(function() {
        return testData.currentPiece;
      })
    };

    expect(util.getCurrentPiece(chessSpy, 'a', '3')).toBe(util.EmptySquareHack);
    expect(chessSpy.get).toHaveBeenCalledWith('a3');

    // Black pawn
    testData.currentPiece = {color: 'b', type: 'p'};
    expect(util.getCurrentPiece(chessSpy, 'a', '3')).toBe('&#9823;');
    expect(chessSpy.get).toHaveBeenCalledWith('a3');

    // White bishop
    testData.currentPiece = {color: 'w', type: 'b'};
    expect(util.getCurrentPiece(chessSpy, 'a', '3')).toBe('&#9815;');
    expect(chessSpy.get).toHaveBeenCalledWith('a3');
  });

  it('should get piece from Numeric entity', function() {
    expect(util.getPieceFromNumericEntity(9814, true)).toBe('&#9814;');
    expect(util.getPieceFromNumericEntity(9814, false)).toBe('&#9820;');

    expect(util.getPieceFromNumericEntity(9818, true)).toBe('&#9818;');
    expect(util.getPieceFromNumericEntity(9818, false)).toBe('&#9812;');
  });
});
