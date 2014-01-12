'use strict';

describe('Service: storejsService', function() {

  // load the service's module
  beforeEach(module('chessLoggerApp'));

  // instantiate service
  var storejsService;
  beforeEach(inject(function(_storejsService_) {
    storejsService = _storejsService_;
  }));

  it('should do something', function() {
    expect(!!Storejs).toBe(true);
  });
});
