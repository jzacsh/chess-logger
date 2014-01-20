'use strict';

describe('Directive: clDownloadTxt', function() {
  var element,
      scope,
      rootScope;

  beforeEach(function() {
    module('chessLoggerApp');
    inject(function($compile, _$rootScope_) {
      rootScope = _$rootScope_;
      scope = rootScope.$new();
      element = $compile(angular.element(
          '<a class="save download btn btn-info"' +
          '   cl-download-txt="test_content"' +
          '   cl-download-file="test_file_name">' +
          '  Download Shakespeare Here</a>'))(scope);
      expect(scope.test_content).toBe(undefined);
      expect(scope.test_file_name).toBe(undefined);
    });
  });

  it('should not set necessary download/href without all params', function() {
    expect(element[0].download).toBeFalsy();
    expect(element[0].href).toBeFalsy();

    scope.test_content = 'foo bar';

    rootScope.$apply();

    expect(element[0].download).toBeFalsy();
    expect(element[0].href).toBeFalsy();
  });

  it('should set necessary download/href with all params', function() {
    scope.test_content = 'foo bar';

    var expectedDataStream = clDownloadBuildDataStream(scope.test_content);
    expect(expectedDataStream).
        toMatch(/data:application\/octet-stream;base64,/);

    scope.test_file_name = 'fake_file.txt';

    rootScope.$apply();

    expect(element[0].download).toBe(scope.test_file_name);
    expect(element[0].href).toBe(expectedDataStream);
  });
});
