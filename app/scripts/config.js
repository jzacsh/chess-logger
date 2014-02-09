'use strict';


var clProviderInjector = function clProviderInjector(
    $locationProvider, $routeProvider, gdriveHistoryServiceProvider) {
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

  console.log(
      'DEBUG: gdriveHistoryServiceProvider:\t',
      gdriveHistoryServiceProvider); //@TODO: remove me!!
  gdriveHistoryServiceProvider.setClientId(
      '1081851510077-b2mpolcoa5r2qjt03rpvn5qcpub528lc' +
      '.apps.googleusercontent.com');
};


angular.
    module('chessLoggerApp').
    config([
      '$locationProvider',
      '$routeProvider',
      'gdriveHistoryServiceProvider',
      clProviderInjector
    ]);
