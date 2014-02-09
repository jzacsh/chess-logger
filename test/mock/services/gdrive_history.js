'use strcit';


/**
 * @type {!Array.<string>}
 */
var mockApisGdriveHistoryService = [
  'loadAuthorization',
  'isAuthorized'
];


/**
 * Mock {@link gdriveHistoryServiceProvider}.
 */
var mockGdriveHistoryServiceProvider = function() {
  console.log('mockGdriveHistoryServiceProvider called!'); //@TODO: remove me!!
  var setClientIdSpy = jasmine.createSpy(
      'gdriveHistoryServiceProvider#setClientId');
  return {
    'footest': '42',
    '$get': function() {
      expect(setClientIdSpy).toHaveBeenCalled();
      expect(setClientIdSpy.mostRecentCall.args[0].length).
          toBeGreaterThan(1);
      return mockGdriveHistoryService;
    },
    setClientId: setClientIdSpy
  };
};

/**
 * Mock {@link gdriveHistoryService}.
 */
var mockGdriveHistoryService = function() {
  var spyingApis = {};
  angular.forEach(mockApisGdriveHistoryService, function(method, index) {
    spyingApis[method] = jasmine.
        createSpy('mockGdriveHistoryService#' + method);
  });
  return spyingApis;
};
