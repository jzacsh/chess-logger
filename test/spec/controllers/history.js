'use strict';

describe('Controller: HistoryCtrl', function() {
  var HistoryCtrl,
      scope;

  beforeEach(function() {
    module(
        'chessLoggerApp',
        function($provide) {
          $provide.factory('storejsService', function() {
            return {storejs: {
              get: jasmine.createSpy(),
              set: jasmine.createSpy()
            }};
          });
        });
    inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      HistoryCtrl = $controller('HistoryCtrl', {
        $scope: scope
      });
    });
  });

  it('should write test', function() {
    this.fail('write me!');
  });
});
