'use strict';

describe('Controller: RecordCtrl', function() {
  var RecordCtrl,
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
