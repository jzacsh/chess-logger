'use strict';



/** @constructor */
var MockStorejsService = function() {
  return {storejs: {
    get: jasmine.createSpy(),
    set: jasmine.createSpy()
  }};
};
