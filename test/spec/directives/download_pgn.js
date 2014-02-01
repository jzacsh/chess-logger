'use strict';

describe('Directive: clDownloadPgn', function() {
  var testPgnDumps,
      testKey = 12345;

  var element,
      scope;

  // ngInjects
  var compile,
      rootScope;

  beforeEach(function() {
    testPgnDumps = {};
    testPgnDumps[testKey] = 'foo bar baz!';

    module(
        'chessLoggerApp',
        function($provide) {
          $provide.value('historyService', {
            readPgnDumps: jasmine.createSpy().andReturn(testPgnDumps)
          });
        });
    inject(function(_$compile_, _$rootScope_) {
      rootScope = _$rootScope_.$new();
      compile = _$compile_;

      scope = rootScope.$new();
      scope.test_key = testKey;
      element = angular.element(
          '<cl-download-pgn cl-gamekey="test_key">' +
          'Download!!</cl-download-pgn>');
      element = compile(element)(scope);
      rootScope.$apply();
    });
  });

  it('should build download link with PGN from history', function() {
    var anchorEl = element.children('a');
    expect(anchorEl.length).toBe(1);

    // Expect consistent styling
    expect(anchorEl.attr('class')).toContain('save');
    expect(anchorEl.attr('class')).toContain('download');

    // Expect clDownloadFile directive is correctly called
    expect(anchorEl.attr('href')).toContain(btoa(testPgnDumps[testKey]));

    var downloadAttr = anchorEl[0].download;
    expect(downloadAttr).toContain(clDownloadFileNamePrefix);
    expect(downloadAttr).toContain(testKey);
    expect(downloadAttr).toContain('.txt');
  });
});
