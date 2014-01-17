'use strict';

angular.
    module('chessLoggerApp', [
      'ngResource',
      'ngSanitize',
      'ngRoute'
    ])
    .config([
      '$locationProvider',
      '$routeProvider',
      function($locationProvider, $routeProvider) {
        $routeProvider.
            when('/', {
              templateUrl: 'views/main.html',
              controller: 'MainCtrl'
            }).
            when('/history', {
              templateUrl: 'views/history.html',
              controller: 'HistoryCtrl'
            }).
            when('/review:gamekey', {
              templateUrl: 'views/review.html',
              controller: 'ReviewCtrl'
            }).
            otherwise({
              redirectTo: '/'
            });
        $locationProvider.hashPrefix('!');
      }
    ]);
