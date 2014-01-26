'use strict';

describe('Controller: ReviewCtrl', function() {
  var ReviewCtrl,
      scope;

  var testGameKey = 1390120529865;

  beforeEach(function() {
    module(
        'chessLoggerApp',
        function($provide) {
          $provide.value('$routeParams', {gamekey: String(testGameKey)});
          $provide.factory('storejsService', mockStorejsService);
        });
    inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      ReviewCtrl = $controller('ReviewCtrl', {
        $scope: scope
      });
    });
  });

  it('should write test', function() {
    this.fail('write me!');
  });
});
