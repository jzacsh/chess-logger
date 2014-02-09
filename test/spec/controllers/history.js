'use strict';

describe('Controller: HistoryCtrl', function() {
  // ngInjects
  var controller,
      location,
      rootScope,
      historyService;

  var historyCtrl,
      scope;

  var spyingTimeout;
  var spyingTimeoutDeferred;

  var rebuildController = function() {
    historyCtrl = controller('HistoryCtrl', {
      '$scope': scope
    });
  };

  beforeEach(function() {
    module(
        'chessLoggerApp',
        function($provide) {
          spyingTimeout = jasmine.createSpy('spying$timeout');
          $provide.value('$timeout', spyingTimeout);
          $provide.factory('chessjsService', mockChessjsService);
          $provide.factory('historyService', mockHistoryService);
        });
    inject(function(
        _$controller_,
        _$location_,
        _$rootScope_,
        $q,
        _historyService_) {
      controller = _$controller_;
      location = _$location_;
      rootScope = _$rootScope_;
      historyService = _historyService_;

      scope = rootScope.$new();

      historyService.havePgnDumps.andReturn(true);
      historyService.haveSettingsSaved.andReturn(true);
      spyOn(location, 'path');

      // TODO(zacsh): Find & import ngPromiseUtils (if for no other purpose
      // than the matchers) and proper $timeout mock.
      spyingTimeout.andCallFake(function(timeoutHandler) {
        spyingTimeoutDeferred = $q.defer();
        spyingTimeoutDeferred.promise.then(timeoutHandler);
        return spyingTimeoutDeferred.promise;
      });
    });

    rebuildController();
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

    it('should reflect PGN-dump storage', function() {
      historyService.haveSettingsSaved.andReturn(false);
      historyService.havePgnDumps.andReturn(false);
      rebuildController();
      expect(location.path).
          toHaveBeenCalledWith(HistoryCtrl.EmptyRedirectDestination);
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

      expect(scope.undo_limbo[testPgnKeyShort]).toBeDefined();
      expect(historyService.deletePgn).not.toHaveBeenCalled();

      spyingTimeoutDeferred.resolve();
      rootScope.$apply();
      expect(scope.undo_limbo[testPgnKeyShort]).toBeFalsy();

      expect(historyService.deletePgn).toHaveBeenCalledWith(testPgnKeyShort);
    });

    it('should delete all games from PGN storage', function() {
      expect(historyService.deleteAllPgns).not.toHaveBeenCalled();

      historyCtrl.deleteAllGames();
      expect(scope.undo_limbo[HistoryCtrl.DeleteAllUndoKey]).toBeDefined();
      expect(historyService.deleteAllPgns).not.toHaveBeenCalled();

      spyingTimeoutDeferred.resolve();
      rootScope.$apply();
      expect(scope.undo_limbo[HistoryCtrl.DeleteAllUndoKey]).toBeFalsy();

      expect(historyService.deleteAllPgns).toHaveBeenCalled();
    });
  });
});
