'use strict';


/**
 * Map of single-page paths to their titles.
 *
 * @type {!Object.<string, string>}
 */
var clNavbarItems = {
  'record': {
    title: 'Record',
    append: ':0'
  },
  'history': {
    title: 'History'
  },
  'review': {
    title: 'Review',
    append: ':0'
  }
};


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
        '  <h1 class="text-muted">' +
        '    Chess Logger: {{nav_items[cl_nav_current].title}}' +
        '  </h1>' +

        '  <ul>' +
        '    <li data-ctrl-nav="{{cl_nav_current}}"' +
        '        ng-class="{' +
        '          ' + "'btn-info'" + ': path !== cl_nav_current,' +
        '          ' + "'btn'" + ': path === cl_nav_current' +
        '        }"' +
        '        ng-repeat="(path, data) in nav_items">' +

        '      <a ng-hide="path == cl_nav_current"' +
        '         ng-href="#!/{{path}}{{data.append}}">{{data.title}}</a>' +
        '      <span ng-show="path == cl_nav_current">{{data.title}}</span>' +

        '    </li>' +
        '  </ul>' +
        '</div>',
    link: function postLink(scope, element, attrs) {
      scope.nav_items = clNavbarItems;

      // Ensure the current loaded page has been configured with this directive.
      scope.cl_nav_current = extractSinglePagePart($location.path());
      if (!scope.nav_items[scope.cl_nav_current]) {
        throw new Error(
            'Could not find path "' + scope.cl_nav_current +
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
