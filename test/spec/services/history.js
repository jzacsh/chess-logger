'use strict';

describe('Service: historyService', function() {
  var historyService,
      storejsService;

  var testGameKey = 1390115196954;

  var mockStorejs;

  beforeEach(function() {
    module(
        'chessLoggerApp',
        function($provide) {
          $provide.factory('storejsService', MockStorejsService);
        });
    inject(function(_historyService_, _storejsService_) {
      historyService = _historyService_;
      storejsService = _storejsService_;

      mockStorejs = storejsService.storejs;
    });

    expect(historyService).toBeDefined();
    expect(storejsService).toBeDefined();

    expect(mockStorejs.get.callCount).toBe(1);
    expect(mockStorejs.set.callCount).toBe(1);
  });

  it('should init PgnHistory when constructing HistoryService', function() {
    this.fail(
      'test setting HistoryService.EmptyPgnHistory both' +
      ' with no history, and with zero-length history');
  });

  it('should construct new game key', function() {
    var gameKey = HistoryService.newGameKey();
    expect(gameKey).toEqual(jasmine.any(Number));
    expect(gameKey).toBeGreaterThan(0);
  });

  it('should build PGN date header', function() {
    var pgnDateHeader = HistoryService.buildDateHeader(testGameKey);
    expect(pgnDateHeader).toEqual(jasmine.any(String));
    expect(pgnDateHeader).toMatch('2014-1-19');
  });

  it('should delete all PGNs from history', function() {
    historyService.deleteAllPgns();
    expect(mockStorejs.set).toHaveBeenCalledWith(
        HistoryService.StorageKeyPgnHistory, HistoryService.EmptyPgnHistory);
  });

  it('should delete one PGN from history', function() {
    var testPgnHistory = { 1234: 'foo'};
    testPgnHistory[testGameKey] = 'to delete';
    mockStorejs.get.andReturn(testPgnHistory);

    historyService.deletePgn(testGameKey);
    expect(mockStorejs.set).toHaveBeenCalledWith(
        HistoryService.StorageKeyPgnHistory, {1234: 'foo'});
  });

  it('should get most recently used player names', function() {
    expect(mockStorejs.get.callCount).toBe(1);

    expect(historyService.getMostRecentName(false)).toBe('');
    expect(mockStorejs.get).
        toHaveBeenCalledWith(HistoryService.StorageKeyRecentSettings);
    expect(mockStorejs.get.callCount).toBe(2);
    expect(historyService.getMostRecentName(true)).toBe('');
    expect(mockStorejs.get.callCount).toBe(3);

    var testRecentSettings = {
      player_b: 'squirrel',
      player_w: 'hippo'
    };

    mockStorejs.get.andReturn(testRecentSettings);
    expect(historyService.getMostRecentName(true)).toBe('hippo');
    expect(mockStorejs.get.callCount).toBe(4);

    expect(historyService.getMostRecentName(false)).toBe('squirrel');
    expect(mockStorejs.get.callCount).toBe(5);
  });
});
