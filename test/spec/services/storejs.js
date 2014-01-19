'use strict';

var TEST_STORE_GLOBAL = 5;

var store = TEST_STORE_GLOBAL;

describe('Service: storejsService', function() {
  var storejsService;
  beforeEach(function() {
    module('chessLoggerApp');
    inject(function(_storejsService_) {
      storejsService = _storejsService_;
    });
    expect(storejsService).toBeDefined();
  });

  it('should save `store` found in global scope', function() {
    expect(storejsService.storejs).toBe(TEST_STORE_GLOBAL);
  });
});
