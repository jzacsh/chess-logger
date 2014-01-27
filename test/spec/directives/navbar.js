'use strict';

describe('Directive: navbar', function() {
  var element,
      scope,
      navEls;

  // ngInject
  var compile,
      rootScope,
      location;

  var testMarkup = '<cl-navbar></cl-navbar>';

  var compileElement = function() {
    element = angular.element(testMarkup);
    compile(element)(scope);
    rootScope.$apply();
  };

  beforeEach(function() {
    module('chessLoggerApp');
    inject(function(_$compile_, _$location_, _$rootScope_, $templateCache) {
      location = _$location_;
      rootScope = _$rootScope_;
      compile = _$compile_;

      expect(Object.keys(clNavbarItems).length).toBeGreaterThan(0);
      angular.forEach(Object.keys(clNavbarItems), function(view) {
        var viewPath = 'views/' + view + '.html';
        $templateCache.put(viewPath, $templateCache.get('app/' + viewPath));
      });

      rootScope.$apply();

      spyOn(location, 'path').andReturn('/history');
      scope = rootScope.$new();
      compileElement();
    });

    navEls = [];
    angular.forEach(element.find('li'), function(navEl) {
      navEls.push(navEl);
    });

    expect(navEls.length).toBe(Object.keys(clNavbarItems).length);
  });

  it('should render pages dynamically as {un,}linked itesm', function() {
    angular.forEach(clNavbarItems, function(navData, path) {
      location.path.andReturn('/' + path);
      compileElement();

      angular.forEach(element.find('[data-ctrl-nav]'), function(navEl) {
        var unClickableEl = navEl.children('span');
        var clickableEl = navEl.children('a');
        if (navEl.attr('data-ctrl-nav') === path) {
          expect(unClickableEl.css('display')).not.toBe('none');
          expect(clickableEl.css('display')).toBe('none');
        } else {
          expect(unClickableEl.css('display')).toBe('none');
          expect(clickableEl.css('display')).not.toBe('none');

          expect(clickableEl.attr('href')).toBe(path);
          expect(clickableEl.title()).toBe(navData.title);
        }
      });
    });
  });

  it('should build single header with current page', function() {
    angular.forEach(clNavbarItems, function(data, path) {
      location.path.andReturn('/' + path);

      compileElement();

      var headerEl = element.find('h1');
      expect(headerEl.length).toBe(1);
      expect(headerEl.text()).toContain('Chess Logger: ' + data.title);
    });
  });
});
