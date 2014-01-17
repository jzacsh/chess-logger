'use strict';

describe('Directive: clDownloadTxt', function() {

  // load the directive's module
  beforeEach(module('chessLoggerApp'));

  var element,
      scope;

  beforeEach(inject(function($compile, $rootScope) {
    scope = $rootScope.$new();
    element = $compile(angular.element(
        '<cl-download-txt></cl-download-txt>'))(scope);
  }));

  it('should make hidden element visible', inject(function($compile) {
    expect(element.text()).toBe('this is the clDownloadTxt directive');
  }));
});
