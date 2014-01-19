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
    expect(mockStorejs.set).toHaveBeenCalledWith(
        HistoryService.StorageKeyPgnHistory, HistoryService.EmptyPgnHistory);
    var callCount = mockStorejs.set.callCount;
    expect(callCount).toBe(1);

    mockStorejs.get = jasmine.createSpy().andCallFake(function(storageKey) {
      expect(storageKey).toBe(HistoryService.StorageKeyPgnHistory);

      var existingData = {};
      existingData[testGameKey] = 'foo';
      return existingData;
    });

    // Re-construct HistoryService, given new storage
    new HistoryService(storejsService);

    // Expect no further initialization, given existing data
    expect(mockStorejs.set.callCount).toBe(callCount);
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

  it('should not re-write existing PGN dumps to disk', function() {
    var existingWriteCount = mockStorejs.set.callCount;
    expect(existingWriteCount).toBe(1);

    var testPgnDump = 'fake pgn data';
    var actualHistoryLength = 1;

    mockStorejs.get = jasmine.createSpy().andCallFake(function(storageKey) {
      expect(storageKey).toBe(HistoryService.StorageKeyPgnHistory);

      var existingData = {};
      existingData[testGameKey] = testPgnDump;
      expect(Object.keys(existingData).length).toBe(actualHistoryLength);
      return existingData;
    });

    // Re-construct HistoryService, given new storage
    new HistoryService(storejsService);

    expect(historyService.writePgnDump(testGameKey, testPgnDump)).
        toBe(actualHistoryLength);
    expect(mockStorejs.set.callCount).toBe(existingWriteCount);
  });
});
