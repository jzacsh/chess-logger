'use strict';


/**
 * Methods making up HistoryService's public API.
 *
 * @type {!Array.<string>}
 */
var historyServiceMockApis = [
  'readPgnDumps',
  'writePgnDump',
  'deletePgn',
  'deleteAllPgns',
  'haveSettingsSaved',
  'rmMostRecentName',
  'getMostRecentName'
];


var mockHistoryService = function() {
  var mockService = {};
  angular.forEach(historyServiceMockApis, function(method) {
    mockService[method] = jasmine.createSpy('hisotryService#' + method);
  });
  return mockService;
};


/** @type {string} */
var testPgnHistoryShort = [
  '"[White "squirrel"]',
  '[Black "hippo"]',
  '[Date "2014-1-18"]',
  '',
  '1. e4 d5',
  '2. exd5 c5',
  '3. dxc6 Nxc6',
  '4. Bb5 b6',
  '5. Bxc6+ Qd7',
  '6. Bxd7+ Bxd7',
  '7. Qg4 Bxg4',
  '8. Kf1 Be2+',
  '9. Kxe2 Rd8',
  '10. d4 Rxd4',
  '11. Be3 Rd2+',
  '12. Kxd2"'
].join('\n');


/** @type {string} */
var testPgnHistoryLong = [
  '[White "jack"]',
  '[Black "jill"]',
  '[Date "2014-1-18"]',
  '',
  '1. e4 d5',
  '2. exd5 e5',
  '3. dxe6 Qd6',
  '4. e7 Kd7',
  '5. e8=R Kxe8',
  '6. Qg4 Qa3',
  '7. Qxc8+ Ke7',
  '8. Qd8+ Kxd8',
  '9. d4 Qb4+',
  '10. Kd1 Qb3',
  '11. d5 c5',
  '12. dxc6 b6',
  '13. c7+ Kd7',
  '14. c8=R Kxc8',
  '15. Kd2 Qd3+',
  '16. Kxd3 b5',
  '17. c4 bxc4+',
  '18. Kd4 c3',
  '19. b3 c2',
  '20. Bd2 c1=R',
  '21. b4 a5',
  '22. bxa5 Nc6+',
  '23. Kd3 Nce7',
  '24. a6 Rb8',
  '25. a7 Rb7',
  '26. a8=N f5',
  '27. g4 fxg4',
  '28. h4 gxh3',
  '29. Rh2 Re1',
  '30. Rg2 h2',
  '31. Nh3 h1=N',
  '32. Kd4 Nd5',
  '33. Kxd5 Kd7',
  '34. Kc4 Rc7+',
  '35. Kb3 Rc3+',
  '36. Nxc3 Kc6',
  '37. Nb5 Kd7',
  '38. Na7 Ke7',
  '39. Nc6+ Kd6',
  '40. Rxe1'
].join('\n');


/**
 * Test chess history made up of two games:
 * {@code testPgnHistoryShort} and {@code testPgnHistoryLong}.
 *
 * @type {!HistoryService.PgnHistory}
 */
var testPgnHistory = {};

/** @type {number} */
var testPgnKeyShort = 1390074738223;
testPgnHistory[testPgnKeyShort] = testPgnHistoryShort;

/** @type {number} */
var testPgnKeyLong = 1390086673140;
testPgnHistory[testPgnKeyLong] = testPgnHistoryLong;
