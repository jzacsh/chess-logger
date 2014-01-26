'use strict';

describe('Controller: HistoryCtrl', function() {
  // ngInjects
  var historyService;

  var historyCtrl,
      scope;

  beforeEach(function() {
    module(
        'chessLoggerApp',
        function($provide) {
          $provide.factory('chessjsService', mockChessjsService);
          $provide.factory('historyService', mockhistoryService);
        });
    inject(function($controller, $rootScope, _historyService_) {
      scope = $rootScope.$new();
      historyService = _historyService_;

      historyCtrl = $controller('HistoryCtrl', {
        $scope: scope
      });
    });
  });

  describe('empty history', function() {
    beforeEach(function() {
      historyService.readPgnDumps.andReturn(
          HistoryService.EmptyPgnHistory);
    });

    it('should reflect number of games', function() {
      expect(historyCtrl.gameCount()).toBe(0);
    });

    it('should reflect PGN-dump storage', function() {
      expect(historyCtrl.getAllGames()).
          toEqual(HistoryService.EmptyPgnHistory);
    });
  });

  describe('existing history', function() {
    beforeEach(function() {
      historyService.readPgnDumps.andReturn(testPgnHistory);
    });

    it('should reflect number of games', function() {
      expect(historyCtrl.gameCount()).toBe(2);
    });

    it('should reflect PGN-dump storage', function() {
      expect(mockChessjsLib.load_pgn).toHaveBeenCalledWith(testPgnHistoryShort);
      expect(mockChessjsLib.load_pgn).toHaveBeenCalledWith(testPgnHistoryLong);
    });

    it('should delete game from PGN-dump storage', function() {
      expect(historyService.deletePgn).not.toHaveBeenCalled();

      historyCtrl.deleteGame(testPgnKeyShort);
      expect(historyService.deletePgn).toHaveBeenCalledWith(testPgnKeyShort);
    });

    it('should delete all games from PGN storage', function() {
      expect(historyService.deleteAllPgns).not.toHaveBeenCalled();

      historyCtrl.deleteAllGames();
      expect(historyService.deleteAllPgns).toHaveBeenCalled();
    });
  });
});
