'use strict';

describe('Directive: clSquarify', function() {
  var element,
      scope;

  // ngInject
  var compile,
      rootScope,
      window;

  var testClientDimension;

  var compileElement = function() {
    element = angular.element(
        '<p id="subject" cl-squarify="{{based_on}}"></p>');
    compile(element)(scope);
    rootScope.$apply();
  };

  beforeEach(function() {
    module('chessLoggerApp');
    inject(function(_$compile_, _$rootScope_, _$window_) {
      compile = _$compile_;
      rootScope = _$rootScope_;
      window = _$window_;

      spyOn(window, 'getComputedStyle').andCallFake(function() {
        return {
          width: testClientDimension + 'px',
          height: testClientDimension + 'px'
        };
      });

      scope = rootScope.$new();
      scope.based_on = 'width';
    });
  });

  it('should make element square, relative to width', function() {
    testClientDimension = 900;
    compileElement();

    var regexp = scope.based_on + ': ' + testClientDimension + 'px;';
    expect(element.attr('style')).toMatch(new RegExp(regexp));
  });

  it('should make element square, relative to height', function() {
    scope.based_on = 'height';
    testClientDimension = 500;
    compileElement();

    var regexp = scope.based_on + ': ' + testClientDimension + 'px;';
    expect(element.attr('style')).toMatch(new RegExp(regexp));
  });
});
