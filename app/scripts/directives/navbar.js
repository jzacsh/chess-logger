'use strict';


/**
 * @param {string|undefined} registeredRoute
 * @return
 *     Given {@link angular.$route} registry, {@code registeredRoute}, return
 *     the single-part page.
 *     eg: given "/foo", should return "foo", given "/" should return "/".
 */
var extractSinglePagePart = function(registeredRoute) {
  var singlePartPathRegExp = /([a-z]+)/;
  if (registeredRoute === '/') {
    return '/';
  } else if (registeredRoute !== 'null') {
    var matches = registeredRoute.match(singlePartPathRegExp);
    return matches ? matches[0] : '';
  }
  return '';
};


/**
 * Logic relies on single part-URLs (eg: '/foo/bar' would fail).
 *
 * @param {!angular.$location} $location
 * @param {!angular.$route} $route
 * @return {!angular.Directive}
 * @ngInject
 */
var clNavbarFactory = function clNavbarFactory($location, $route) {
  return {
    restrict: 'E',
    replace: true,
    template:
        '<div class="header cl-navbar">' +
        '  <h1 class="text-muted">Chess Logger: {{nav_items[current]}}</h1>' +
        '  <ul>' +
        '    <li ng-class="{' +
        '          ' + "'btn-info'" + ': url !== current,' +
        '          ' + "'btn'" + ': url === current' +
        '        }"' +
        '        ng-repeat="(url,item) in nav_items">' +
        '      <a ng-hide="url == current"' +
        '         ng-href="{{format(url)}}">{{item}}</a>' +
        '      <span ng-show="url == current" >{{item}}</span>' +
        '    </li>' +
        '  </ul>' +
        '</div>',
    link: function postLink(scope, element, attrs) {
      /**
       * Map of single-page paths to their titles.
       *
       * @type {!Object.<string, string>}
       */
      scope.nav_items = {
        '/': 'Record',
        'history': 'History',
        'review': 'Review'
      };

      /**
       * @param {string} url
       * @return {string}
       */
      scope.format = function(url) {
        return url === '/' ? url : ('/' + url);
      };

      // Ensure the current loaded page has been configured with this directive.
      scope.current = extractSinglePagePart($location.path());
      if (!scope.nav_items[scope.current]) {
        throw new Error(
            'Could not find path "' + scope.current +
            '" in configured nav items');
      }

      var foundRoutes = {};
      angular.forEach($route.routes, function(route, path) {
        var page = extractSinglePagePart(path);
        if (page && !foundRoutes[page]) {
          foundRoutes[page] = true;
          if (!scope.nav_items[page]) {
            throw new Error(
                'Found angular.$route, "' + page + '", unregistered with ' +
                'this directive.');
          }
        }
      });

      var navItemsPages = Object.keys(scope.nav_items);
      var foundRoutesPages = Object.keys(foundRoutes);
      if (navItemsPages.length !== foundRoutesPages.length) {
        throw new Error(
            navItemsPages.length + ' routes predefined in directive ("' +
            navItemsPages.join('", "') + '"), but ' + foundRoutesPages.length +

            ' routes registered with angular.$route ("' +
            foundRoutesPages.join('", "') + '").');
      }

      // TODO(zacsh): Figure out how to get rid of this entire directive's
      // hackery by getting a cleaner version of $route.routes map, then delete
      // this:
      scope.nav_items['review:0'] = scope.nav_items['review'];
      delete scope.nav_items.review;
    }
  };
};

angular.
    module('chessLoggerApp').
    directive('clNavbar', [
      '$location',
      '$route',
      clNavbarFactory
    ]);
