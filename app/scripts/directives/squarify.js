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
  /**
   * Testable alternative to {@code element} reflection:
   * <code>el.prop('clientWidth')</code>
   *
   * @param {!jqLite} el
   * @param {clSquarify} dimension
   * @return {number}
   *     Pixel dimension of {@code el}, as reported by {@code $window}.
   */
  var getDimension = function(el, dimension) {
    var dim = dimension.toLowerCase();
    var computedStyle = $window.
        getComputedStyle(el)[dim].match(/^(\d+)\w+$/);
    return parseInt(computedStyle, 10);
  };

  return {
    restrict: 'A',
    link: function postLink(scope, element, attrs) {
      var squarify = function() {
        var squarifyBy = clSquarifyBy[String(attrs.clSquarify).toLowerCase()];

        // TODO(zacsh): Figure out why element.css() won't work in test
        var style = '';
        style += element.attr('style') ? '; ' : '';
        style += squarifyBy + ': ' + getDimension(element, squarifyBy) + 'px;';
        element.attr('style', style);
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
