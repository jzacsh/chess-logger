'use strict';



/** @constructor */
var MockStorejsService = function() {
  return {storejs: {
    get: jasmine.createSpy('storejs.get'),
    set: jasmine.createSpy('storejs.set')
  }};
};
