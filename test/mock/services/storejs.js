'use strict';



/** @constructor */
var mockStorejsService = function() {
  return {storejs: {
    get: jasmine.createSpy('storejs.get'),
    set: jasmine.createSpy('storejs.set')
  }};
};
