'use strict';

describe('Service: Storejs', function () {

  // load the service's module
  beforeEach(module('chessLoggerApp'));

  // instantiate service
  var Storejs;
  beforeEach(inject(function (_Storejs_) {
    Storejs = _Storejs_;
  }));

  it('should do something', function () {
    expect(!!Storejs).toBe(true);
  });

});
