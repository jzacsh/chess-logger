'use strict';


/**
 * @type {enum}
 */
var clSquarifyBy = {
  width: 'width',
  height: 'height'
};


/**
 * @param {!angular.$window} $window
 * @return {!angular.Directive}
 * @ngInject
 */
var clSquarifyFactory = function clSquarifyFactory($window) {
  return {
    restrict: 'A',
    link: function postLink(scope, element, attrs) {
      var squarify = function() {
        var squarifyBy = clSquarifyBy[String(attrs.clSquarify).toLowerCase()];

        var prop = 'client' +
            squarifyBy.charAt(0).toUpperCase() +
            squarifyBy.slice(1);
        var otherDim = squarifyBy === clSquarifyBy.width ?
                      clSquarifyBy.height : clSquarifyBy.width;
        element.css(otherDim, element.prop(prop));
      };
      squarify();

      // Rerun in event page is resized
      angular.element($window).bind('resize', squarify);
    }
  };
};


angular.
    module('chessLoggerApp').
    directive('clSquarify', [
      '$window',
      clSquarifyFactory
    ]);
