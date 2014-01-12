'use strict';

describe('Service: Chessjs', function() {

  // load the service's module
  beforeEach(module('chessLoggerApp'));

  // instantiate service
  var Chessjs;
  beforeEach(inject(function(_Chessjs_) {
    Chessjs = _Chessjs_;
  }));

  it('should do something', function() {
    expect(!!Chessjs).toBe(true);
  });

});
