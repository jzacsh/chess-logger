'use strict';

describe('Controller: ReviewCtrl', function() {
  var reviewCtrl,
      scope;

  // ngInjects
  var routeParams,
      controller,
      historyService,
      location;

  var buildController = function() {
    return controller('ReviewCtrl', {
      $scope: scope
    });
  };

  beforeEach(function() {
    module(
        'chessLoggerApp',
        function($provide) {
          $provide.value('$routeParams', {
            gamekey: String(ReviewCtrl.NewGameKey)
          });
          $provide.value('$location', {
            path: jasmine.createSpy('$locaton#path')
          });
          $provide.factory('chessjsService', mockChessjsService);
          $provide.factory('historyService', mockHistoryService);
        });
    inject(function(
        _$controller_,
        $rootScope,
        _$location_,
        _$routeParams_,
        _historyService_) {
      routeParams = _$routeParams_;
      historyService = _historyService_;
      controller = _$controller_;
      location = _$location_;

      scope = $rootScope.$new();
      reviewCtrl = buildController();
    });
  });

  describe('game upload', function() {
    it('should have page in upload mode', function() {
      expect(scope.upload_game).toBe(true);
    });

    it('should reject invalid PGN uploads', function() {
      mockChessjsLib.load_pgn.andReturn(true);
      expect(reviewCtrl.isRawPgnValid('valid pgn!')).toBe(true);

      mockChessjsLib.load_pgn.andReturn(false);
      expect(reviewCtrl.isRawPgnValid('')).toBe(false);
    });

    it('should save raw PGN dump to history', function() {
      var testKey = 12345;
      spyOn(HistoryService, 'newGameKey').andReturn(testKey);

      reviewCtrl.submitRawGamePgn('test pgn');
      expect(HistoryService.newGameKey).toHaveBeenCalled();

      expect(historyService.writePgnDump).
          toHaveBeenCalledWith(testKey, 'test pgn');
      expect(location.path).toHaveBeenCalledWith('/review:' + testKey);
    });
  });

  describe('game review', function() {
    beforeEach(function() {
      expect(scope.upload_game).toBe(true);

      routeParams.gamekey = String(testPgnKeyLong);
      historyService.readPgnDumps.andReturn(testPgnHistory);
      reviewCtrl = buildController();

      expect(scope.upload_game).toBe(false);
      expect(scope.game.pgn_dump).toBe(testPgnHistoryLong);
    });

    it('should load current game', function() {
      expect(mockChessjsLib.load_pgn).toHaveBeenCalledWith(testPgnHistoryLong);
      expect(mockChessjsLib.load_pgn).toHaveBeenCalledWith(testPgnHistoryLong);
    });

    it('should provide last move index', function() {
      mockChessjsLib.history.andReturn(['one move']);
      reviewCtrl.getLastPossibleIndex(0);

      mockChessjsLib.history.andReturn(['one move', 'second move']);
      reviewCtrl.getLastPossibleIndex(1);
    });

    it('should convert move number to pgn-line number', function() {
      mockChessjsLib.history.andReturn([
        'one move', 'second move'     // first PGN line
      ]);
      expect(reviewCtrl.getMoveLineNumber()).toBe(0);

      mockChessjsLib.history.andReturn([
        'one move', 'second move',    // first PGN line
        'third move'                  // second PGN line
      ]);
      expect(reviewCtrl.getMoveLineNumber()).toBe(1);
      mockChessjsLib.history.andReturn([
        'one move', 'second move',    // first PGN line
        'third move', 'fourth move'   // second PGN line
      ]);
      expect(reviewCtrl.getMoveLineNumber()).toBe(1);

      mockChessjsLib.history.andReturn([
        'one move', 'second move',    // first PGN line
        'third move', 'fourth move',  // second PGN line
        'fifth move', 'sixth move'    // third PGN line
      ]);
      expect(reviewCtrl.getMoveLineNumber()).toBe(2);
    });
  });
});
