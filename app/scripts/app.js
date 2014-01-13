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
            when('/#history', { redirectTo: '/history' }).
            when('/history', {
              templateUrl: 'views/history.html',
              controller: 'HistoryCtrl'
            }).
            otherwise({
              redirectTo: '/'
            });
        $locationProvider.html5Mode(true).hashPrefix('!');
      }
    ]);
