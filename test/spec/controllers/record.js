'use strict';

describe('Controller: RecordCtrl', function() {
  var controller,
      rootScope,
      location,
      routeParams,
      historyService,
      recordCtrl,
      scope;

  var testGameKey = 1390120529865;

  var buildRecordController = function() {
    scope = rootScope.$new();
    return controller('RecordCtrl', {
      $scope: scope
    });
  };

  beforeEach(function() {
    module(
        'chessLoggerApp',
        function($provide) {
          $provide.value('$location', {
            path: jasmine.createSpy('path')
          });
          $provide.value('$routeParams', {gamekey: '0'});
          $provide.factory('chessjsService', mockChessjsService);
          $provide.factory('storejsService', mockStorejsService);
        });
    inject(function(
        _$controller_,
        _$rootScope_,
        _$location_,
        _$routeParams_,
        _chessjsService_,
        _historyService_) {
      controller = _$controller_;
      rootScope = _$rootScope_;
      location = _$location_;
      routeParams = _$routeParams_;
      historyService = _historyService_;

      recordCtrl = buildRecordController();
    });
  });

  describe('initial load', function() {
    describe('first visit', function() {
      it('should have empty black and white player name', function() {
        expect(scope.white_name).toBeFalsy();
        expect(scope.black_name).toBeFalsy();
      });

      it('should have loaded black and white player name', function() {
        spyOn(historyService, 'getMostRecentName').
            andCallFake(function(forWhite) {
              return forWhite ? 'jack' : 'jill';
            });

        recordCtrl = buildRecordController();
        expect(scope.white_name).toBe('jack');
        expect(scope.black_name).toBe('jill');
      });

      it('should reload page with permalink after first move', function() {
        var testGameKeyNew = testGameKey + 30;
        spyOn(HistoryService, 'newGameKey').andReturn(testGameKeyNew);

        var mockHistory = [];
        expect(mockChessjsLib.get).not.toHaveBeenCalled();
        expect(mockChessjsLib.turn).not.toHaveBeenCalled();
        mockChessjsLib.get.andCallFake(function() {
          return {color: 'w', type: 'p'};
        });
        mockChessjsLib.turn.andCallFake(function() {
          return 'w';
        });
        mockChessjsLib.history.andCallFake(function() {
          return mockHistory;
        });
        spyOn(historyService, 'writePgnDump');

        // Start transition of first white pawn
        recordCtrl.moveTransition('a', '2');
        expect(mockChessjsLib.get).toHaveBeenCalledWith('a2');
        expect(mockChessjsLib.turn).toHaveBeenCalled();
        recordCtrl.toPgn();  // Mock template digest cycle behavior

        expect(location.path).not.toHaveBeenCalled();
        expect(historyService.writePgnDump).not.toHaveBeenCalled();

        // Complete transition of said pawn, two squares forward
        recordCtrl.moveTransition('a', '4');
        mockHistory.push('a4');
        recordCtrl.toPgn();  // Mock template digest cycle behavior

        expect(location.path).toHaveBeenCalledWith('/record:' + testGameKeyNew);
        expect(historyService.writePgnDump).toHaveBeenCalled();
      });

      it('should redirect to history if game not found', function() {
        routeParams.gamekey = String(testGameKey);
        recordCtrl = buildRecordController();
        expect(location.path).toHaveBeenCalledWith('/history');
      });
    });

    describe('returning visit', function() {
      var testPgnHistory;

      var testPlayerWhite = 'jack';
      var testPlayerBlack = 'jill';

      beforeEach(function() {
        // Pretend controller is loaded for test game
        routeParams.gamekey = String(testGameKey);

        // Build test history, populating test game
        testPgnHistory = {};
        testPgnHistory[testGameKey] = [
          '[White "carolyn"]',
          '[Black "hippo"]',
          '[Date "2014-1-25"]',
          '',
          '1. a4'
        ].join('\n');

        spyOn(historyService, 'readPgnDumps').andCallFake(function() {
          return testPgnHistory;
        });
        spyOn(historyService, 'getMostRecentName').
            andCallFake(function(forWhite) {
              return forWhite ? testPlayerWhite : testPlayerBlack;
            });

        recordCtrl = buildRecordController();
      });

      it('should pre-populate black and white player name', function() {
        expect(scope.white_name).toBe(testPlayerWhite);
        expect(scope.black_name).toBe(testPlayerBlack);
      });

      it('should load chess PGN from history', function() {
        expect(mockChessjsLib.load_pgn).
            toHaveBeenCalledWith(testPgnHistory[testGameKey]);
      });

      it('should redirect to /review:key if loading finished game', function() {
        mockChessjsLib.game_over.andReturn(true);
        recordCtrl = buildRecordController();
        expect(location.path).toHaveBeenCalledWith('/review:' + testGameKey);
      });

      afterEach(function() {
        expect(location.path).not.toHaveBeenCalledWith('/history');
      });
    });
  });
});
