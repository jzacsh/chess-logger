'use strict';

describe('Controller: RecordCtrl', function() {
  var RecordCtrl,
      scope;

  var chessSpy = {
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
  var testGameKey = 1390120529865;

  beforeEach(function() {
    module(
        'chessLoggerApp',
        function($provide) {
          $provide.value('$routeParams', {gamekey: String(testGameKey)});
          $provide.factory('chessjsService', function() {
            return {
              util: {
                getOccupationColor: jasmine.createSpy()
              },
              Chessjs: function() {
                this.prototype = chessSpy;
              }
            };
          });
          $provide.factory('storejsService', function() {
            return {storejs: {
              get: jasmine.createSpy(),
              set: jasmine.createSpy()
            }};
          });
        });
    inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      RecordCtrl = $controller('RecordCtrl', {
        $scope: scope
      });
    });
  });

  it('should write test', function() {
    this.fail('write me!');
  });
});
