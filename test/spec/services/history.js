'use strict';

describe('Service: historyService', function() {
  var historyService,
      storejsService;

  var testGameKey = 1390115196954;

  var mockStorejs;

  var initialWriteCount,
      initialReadCount;

  beforeEach(function() {
    module(
        'chessLoggerApp',
        function($provide) {
          $provide.factory('storejsService', mockStorejsService);
        });
    inject(function(_historyService_, _storejsService_) {
      historyService = _historyService_;
      storejsService = _storejsService_;

      mockStorejs = storejsService.storejs;
    });

    expect(historyService).toBeDefined();
    expect(storejsService).toBeDefined();

    initialReadCount = mockStorejs.get.callCount;
    expect(initialReadCount).toBe(1);
    initialWriteCount = mockStorejs.set.callCount;
    expect(initialWriteCount).toBe(1);
  });

  it('should init PgnHistory when constructing HistoryService', function() {
    expect(mockStorejs.set).toHaveBeenCalledWith(
        HistoryService.StorageKeyPgnHistory, HistoryService.EmptyPgnHistory);

    mockStorejs.get = jasmine.createSpy().andCallFake(function(storageKey) {
      expect(storageKey).toBe(HistoryService.StorageKeyPgnHistory);

      var existingData = {};
      existingData[testGameKey] = 'foo';
      return existingData;
    });

    // Re-construct HistoryService, given new storage
    new HistoryService(storejsService);

    // Expect no further initialization, given existing data
    expect(mockStorejs.set.callCount).toBe(initialWriteCount);
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

  it('should not re-write existing PGN dumps to disk', function() {
    var testPgnDump = 'fake pgn data';
    var actualHistoryLength = 1;

    mockStorejs.get = jasmine.createSpy().andCallFake(function(storageKey) {
      expect(storageKey).toBe(HistoryService.StorageKeyPgnHistory);

      var existingData = {};
      existingData[testGameKey] = testPgnDump;
      expect(Object.keys(existingData).length).toBe(actualHistoryLength);
      return existingData;
    });
    historyService = new HistoryService(storejsService);

    // `writePgnDump` should report latest length correctly
    expect(historyService.writePgnDump(testGameKey, testPgnDump)).
        toBe(actualHistoryLength);

    expect(mockStorejs.set.callCount).toBe(initialWriteCount);
  });

  it('should write new data to storage', function() {
    var testPgnDump = 'fake pgn data';
    var initialHistoryLength = 1;

    var existingData = {};
    existingData[testGameKey] = testPgnDump;
    expect(Object.keys(existingData).length).toBe(initialHistoryLength);

    mockStorejs.get = jasmine.createSpy().andCallFake(function(storageKey) {
      expect(storageKey).toBe(HistoryService.StorageKeyPgnHistory);
      return existingData;
    });

    // new history to write
    var testGameKeyB = testGameKey + 10,
        testPgnDumpB = testPgnDump + testPgnDump;

    new HistoryService(storejsService);
    var currentHistoryLength = historyService.
        writePgnDump(testGameKeyB, testPgnDumpB);

    expect(mockStorejs.set.callCount).toBe(initialWriteCount + 1);

    // `writePgnDump` should report latest length correctly
    var existingDataLength = Object.keys(existingData).length;
    expect(existingDataLength).toBe(currentHistoryLength);

    expect(currentHistoryLength).toBe(initialHistoryLength + 1);
  });

  it('should over-write existing data in storage', function() {
    var testPgnDump = 'fake pgn data';
    var initialHistoryLength = 1;

    var existingData = {};
    existingData[testGameKey] = testPgnDump;
    expect(Object.keys(existingData).length).toBe(initialHistoryLength);
    mockStorejs.get = jasmine.createSpy().andCallFake(function(storageKey) {
      expect(storageKey).toBe(HistoryService.StorageKeyPgnHistory);
      return existingData;
    });

    historyService = new HistoryService(storejsService);
    var currentHistoryLength = historyService.
        writePgnDump(testGameKey, testPgnDump + 'test update to pgn');

    expect(mockStorejs.set.callCount).toBe(initialWriteCount + 1);

    expect(currentHistoryLength).toBe(initialHistoryLength);
  });

  it('should maintain cap on PGN histories on localStorage', function() {
    var testPgnDump = 'fake pgn data';

    /**
     * @param {number} index
     * @return {string}
     *     Consistent variation on {@code testGameKey}, based on {@code index}.
     */
    var buildGameKey = function(index) {
      return testGameKey + index;
    };

    // Intialize storage close to the allowed cap
    var existingData = {};
    for (var i = 1; i < HistoryService.MaxPgnHistory; ++i) {
      existingData[buildGameKey(i)] = testPgnDump;
    }
    expect(Object.keys(existingData).length).
        toBe(HistoryService.MaxPgnHistory - 1);

    mockStorejs.get = jasmine.createSpy().andCallFake(function(storageKey) {
      expect(storageKey).toBe(HistoryService.StorageKeyPgnHistory);
      return existingData;
    });

    historyService = new HistoryService(storejsService);

    // Should allow just one more write
    var currentHistoryLength = historyService.
        writePgnDump(testGameKey, testPgnDump + 'test update to pgn');
    expect(mockStorejs.set.callCount).toBe(initialWriteCount + 1);
    expect(currentHistoryLength).toBe(HistoryService.MaxPgnHistory);

    var expectedKeys = (function() {
      var expectedKeys = [];
      for (var i = 1; i < HistoryService.MaxPgnHistory; ++i) {
        expectedKeys.push(buildGameKey(i));
      }
      // The last, max-limit, write:
      expectedKeys.push(testGameKey);

      return expectedKeys;
    })();

    // TODO(zacsh): why doesn't toEqual work?
    // expect(Object.keys(existingData)).toEqual(expectedKeys);
    expect(Object.keys(existingData).join('|')).toBe(expectedKeys.join('|'));

    expect(Object.keys(existingData).length).
        not.toBeGreaterThan(HistoryService.MaxPgnHistory);

    // Should push off the oldest write
    var overMaxCapKey = buildGameKey(HistoryService.MaxPgnHistory + 1);
    var currentHistoryLength = historyService.
        writePgnDump(overMaxCapKey, testPgnDump + 'test update to pgn');
    expect(mockStorejs.set.callCount).toBe(initialWriteCount + 2);

    // Confirm reported and actual data length
    expect(currentHistoryLength).toBe(HistoryService.MaxPgnHistory);
    expect(Object.keys(existingData).length).
        not.toBeGreaterThan(HistoryService.MaxPgnHistory);


    // Remove the oldest key that was added on, last.
    expect(expectedKeys.pop()).toBe(testGameKey);
    expectedKeys.push(overMaxCapKey);

    expect(Object.keys(existingData).join('|')).
        toBe(expectedKeys.join('|'));
  });

  it('should read existing data', function() {
    var existingData = {};
    existingData[testGameKey] = 'foo';
    existingData[testGameKey + 5] = 'foo bar';
    mockStorejs.get = jasmine.createSpy().andCallFake(function(storageKey) {
      expect(storageKey).toBe(HistoryService.StorageKeyPgnHistory);
      return existingData;
    });

    historyService = new HistoryService(storejsService);
    expect(historyService.readPgnDumps()).toBe(existingData);
  });

  describe('preferences & settings', function() {
    var expectedSettings;

    beforeEach(function() {
      expectedSettings = {};
      mockStorejs.get = jasmine.createSpy().andCallFake(function(storageKey) {
        expect(storageKey).toBe(HistoryService.StorageKeyRecentSettings);
        return expectedSettings;
      });
      expect(historyService.haveSettingsSaved()).toBe(false);
      initialReadCount = mockStorejs.get.callCount;
      initialWriteCount = mockStorejs.set.callCount;
    });

    it('should get most recently used player names', function() {
      expect(historyService.getMostRecentName(false)).toBe('');
      expect(mockStorejs.get).
          toHaveBeenCalledWith(HistoryService.StorageKeyRecentSettings);
      expect(mockStorejs.get.callCount).toBe(initialReadCount + 1);
      expect(historyService.getMostRecentName(true)).toBe('');
      expect(mockStorejs.get.callCount).toBe(initialReadCount + 2);

      var testRecentSettings = {
        player_b: 'squirrel',
        player_w: 'hippo'
      };

      mockStorejs.get.andReturn(testRecentSettings);
      expect(historyService.getMostRecentName(true)).toBe('hippo');
      expect(mockStorejs.get.callCount).toBe(initialReadCount + 3);

      expect(historyService.getMostRecentName(false)).toBe('squirrel');
      expect(mockStorejs.get.callCount).toBe(initialReadCount + 4);

      expect(historyService.haveSettingsSaved()).toBe(true);
    });

    it('should set most recent name', function() {
      expectedSettings[HistoryService.PlayerSettingPrefix + 'w'] = 'Squirrel';
      historyService.setMostRecentName('Squirrel', true  /* white */);
      expect(mockStorejs.set.callCount).toBe(initialWriteCount + 1);
      expect(mockStorejs.set.mostRecentCall.args[0]).
          toEqual(HistoryService.StorageKeyRecentSettings);
      expect(mockStorejs.set.mostRecentCall.args[1]).
          toEqual(expectedSettings);

      expectedSettings[HistoryService.PlayerSettingPrefix + 'b'] = 'Hippo';
      historyService.setMostRecentName('Hippo', false  /* black */);
      expect(mockStorejs.set.callCount).toBe(initialWriteCount + 2);
      expect(mockStorejs.set.mostRecentCall.args[0]).
          toEqual(HistoryService.StorageKeyRecentSettings);
      expect(mockStorejs.set.mostRecentCall.args[1]).
          toEqual(expectedSettings);

      expect(historyService.haveSettingsSaved()).toBe(true);
    });

    it('should remove most recent name', function() {
      expect(historyService.getMostRecentName(true  /* white */)).toBe('');

      var testName = 'Hippo';
      historyService.setMostRecentName(testName, true  /* white */);

      expect(historyService.getMostRecentName(true)).toBe(testName);
      expect(historyService.haveSettingsSaved()).toBe(true);

      historyService.rmMostRecentName(testName, true  /* white */);

      expect(historyService.haveSettingsSaved()).toBe(false);
    });
  });
});
