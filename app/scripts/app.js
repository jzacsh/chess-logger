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
            when('/record:gamekey', {
              templateUrl: 'views/record.html',
              controller: 'RecordCtrl'
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
              redirectTo: '/history'
            });
        $locationProvider.hashPrefix('!');
      }
    ]);
