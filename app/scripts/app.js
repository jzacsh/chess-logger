'use strict';

angular.module('chessLoggerApp', [
  'ngResource',
  'ngSanitize',
  'ngRoute'
])
  .config(function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
