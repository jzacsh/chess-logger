'use strict';

describe('Controller: RecordCtrl', function() {
  var historyService,
      recordCtrl,
      scope;

  var testGameKey = 1390120529865;

  beforeEach(function() {
    module(
        'chessLoggerApp',
        function($provide) {
          $provide.value('$routeParams', {gamekey: String(testGameKey)});
          $provide.factory('chessjsService', MockChessjsService);
          $provide.factory('storejsService', MockStorejsService);
        });
    inject(function($controller, $rootScope, _historyService_) {
      scope = $rootScope.$new();
      historyService = _historyService_;

      recordCtrl = $controller('RecordCtrl', {
        $scope: scope
      });
    });
  });

  describe('initial load', function() {
    describe('first visit', function() {
      it('should have empty black and white player name', function() {
        this.fail('test scope.white_name, scope.black_name');
      });

      it('should reload page with permalink after first move', function() {
        this.fail('test moveTransition and $location.path');
      });
    });

    describe('returning visit', function() {
      beforeEach(function() {
        this.fail('configure historyService....andCallFake()');
      });

      it('should pre-populate black and white player name', function() {
        this.fail('test scope.white_name, scope.black_name');
      });

      it('should load chess PGN from history', function() {
        this.fail("spy on `new Chess()`'s load_pgn");
      });

      it('should redirect to /review if loading completed game', function() {
        this.fail('spy $location.path for correct `/review:[foo]` arg');
      });
    });
  });
});
