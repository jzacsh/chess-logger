'use strict';

describe('Service: chessjsService', function() {

  // load the service's module
  beforeEach(module('chessLoggerApp'));

  // instantiate service
  var chessjsService;
  beforeEach(inject(function(_chessjsService_) {
    chessjsService = _chessjsService_;
  }));

  it('should do something', function() {
    expect(!!chessjsService).toBe(true);
  });
});
