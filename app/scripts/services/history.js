'use strict';


/**
 * @param {!Object} storejsService
 *     github.com/marcuswestin/store.js
 * @constructor
 */
var HistoryService = function HistoryService(storejsService) {
  /**
   * localStorage API from github.com/marcuswestin/store.js
   *
   * @private {!Object}
   */
  this.storejs_ = storejsService.storejs;

  /**
   * Cache of last PGN dumps of game, to avoid excess IO due to
   * angularjs-controller $digest cyles.
   *
   * @private {!HistoryService.PgnHistory}
   */
  this.lastPgnRead_ = {};

  // Update PGN cache, or fallback to above setting.
  this.lastPgnRead_ = this.readPgnDumps();
};


/**
 * A history of PGN game dumps, keyed by their start time.
 * @type {Object.<string, string>}
 */
HistoryService.PgnHistory;


/**
 * Empty PGN history.
 * @const
 */
HistoryService.EmptyPgnHistory = {};


/**
 * General settings aside from game history to be saved.
 *
 * <p>
 * "player_w" and "player_b" to indicate player names.
 * </p>
 *
 * @typedef {{
 *     player_b: string,
 *     player_w: string
 *     }}
 */
HistoryService.GameSettings;


/**
 * Storage key for PGN game data.
 * @type {string}
 */
HistoryService.StorageKeyPgnHistory = 'ChessJsPgnDump';


/**
 * Storage key for recent preferences and settings.
 * @see {@link HistoryService.GameSettings}.
 * @type {string}
 */
HistoryService.StorageKeyRecentSettings = 'ChessJsPgnSettings';


/**
 * Maximum number of games that can be stored in history.
 * @type {number}
 */
HistoryService.MaxPgnHistory = 20;


/**
 * @return {number}
 *     {@code new Date().getTime()}
 */
HistoryService.newGameKey = function() {
  return new Date().getTime();
};


/**
 * @param {number} gameKey
 *     @see {@link #newGameKey}.
 * @return {string}
 *     "Date" header as specified by PGN format. This is just an ISO-8601 date
 *     string.
 */
HistoryService.buildDateHeader = function(gameKey) {
  var gameDate = new Date(gameKey);
  return [
    gameDate.getUTCFullYear(),
    (gameDate.getUTCMonth() + 1),
    gameDate.getUTCDate()
  ].join('-');
};


/**
 * @param {string} pgnKey
 * @param {string} pgnDump
 * @return {boolean}
 *     Whether {@code pgnDump} is already stored under {@code pgnKey}.
 * @private
 */
HistoryService.prototype.havePgnDump_ = function(pgnKey, pgnDump) {
  return this.havePgnKey_(pgnKey) && pgnDump === this.readPgnDumps()[pgnKey];
};


/**
 * @param {string} pgnKey
 * @return {boolean}
 *     Whether a PGN dump seems to exist under {@code pgnKey}.
 * @private
 */
HistoryService.prototype.havePgnKey_ = function(pgnKey) {
  return Object.keys(this.readPgnDumps()).length &&
         !!this.readPgnDumps()[pgnKey];
};


/**
 * Writes PGN dump of a game, {@code pgnDump},
 * to {@link HistoryService.PgnHistory}.
 *
 * @param {string} pgnKey
 * @param {string} pgnDump
 * @return {number}
 *     Returns the number of items in history.
 */
HistoryService.prototype.writePgnDump = function(pgnKey, pgnDump) {
  var modifiedHistory;
  if (!this.havePgnDump_(pgnKey, pgnDump)) {
    modifiedHistory = this.readPgnDumps();
    modifiedHistory[pgnKey] = pgnDump;

    if (Object.keys(modifiedHistory).length > HistoryService.MaxPgnHistory) {
      this.deletePgn(HistoryService.getOldestPgnKey_(modifiedHistory));
    }

    this.writePgnHistory_(modifiedHistory);
    this.setPgnIOCache_({});
  }
  return modifiedHistory ?
         Object.keys(modifiedHistory).length :
         Object.keys(this.readPgnDumps()).length;
};


/**
 * @param {string} pgnHistory
 * @private
 */
HistoryService.prototype.writePgnHistory_ = function(pgnHistory) {
  this.storejs_.set(HistoryService.StorageKeyPgnHistory, pgnHistory);
};


/**
 * Resets internal structure to cache PGN I/O, to {@code setCacheTo}.
 * @param {!HistoryService.PgnHistory} setCacheTo
 * @private
 */
HistoryService.prototype.setPgnIOCache_ = function(setCacheTo) {
  this.lastPgnRead_ = setCacheTo || HistoryService.EmptyPgnHistory;
  if (!setCacheTo) {
    // Was empty
    this.writePgnHistory_(this.lastPgnRead_);
  }
};


/** @return {!HistoryService.PgnHistory} */
HistoryService.prototype.readPgnDumps = function() {
  if (!Object.keys(this.lastPgnRead_).length) {
    this.setPgnIOCache_(
        this.storejs_.get(HistoryService.StorageKeyPgnHistory));
  }
  return this.lastPgnRead_;
};


/**
 * @param {!HistoryService.PgnHistory} pgnHistory
 * @return {string}
 *     PGN key of the oldest item in {@code pgnHistory}.
 * @private
 */
HistoryService.getOldestPgnKey_ = function(pgnHistory) {
  var oldest = new Date().getTime() + 9999999;
  angular.forEach(pgnHistory, function(pgnDump, pgnKey) {
    oldest = (pgnKey && pgnKey < oldest) ? pgnKey : oldest;
  });
  return oldest;
};


/**
 * @param {string} pgnKey
 * @return {number}
 *     New length of game-history, given deletion of {@code pgnKey}.
 */
HistoryService.prototype.deletePgn = function(pgnKey) {
  var pgnHistory = this.readPgnDumps();
  if (pgnHistory[pgnKey]) {
    delete pgnHistory[pgnKey];
    this.writePgnHistory_(pgnHistory);
  }
  this.setPgnIOCache_(pgnHistory);
  return Object.keys(pgnHistory).length;
};


/**
 * Deletes all game history.
 * @return {number}
 *     Number of games deleted.
 */
HistoryService.prototype.deleteAllPgns = function() {
  var numberDeleted = Object.keys(this.readPgnDumps()).length;
  this.writePgnHistory_(HistoryService.EmptyPgnHistory);
  this.setPgnIOCache_({});
  return numberDeleted;
};


/**
 * Saves {@code playerName} for future reference, to better enable UI
 * preferences.
 *
 * @param {string} playerName
 * @param {boolean} isForWhite
 */
HistoryService.prototype.setMostRecentName = function(playerName, isForWhite) {
  var recentSettings = this.storejs_.get(
      HistoryService.StorageKeyRecentSettings);
  recentSettings = recentSettings || {};

  var settingsKey = 'player_' + (isForWhite ? 'w' : 'b');
  recentSettings[settingsKey] = playerName;
  this.storejs_.set(HistoryService.StorageKeyRecentSettings, recentSettings);
};


/**
 * @param {boolean} isForWhite
 * @return {string}
 *     Name of the most recent player for black, unless {@code isForWhite} in
 *     which case most recent player for white.
 */
HistoryService.prototype.getMostRecentName = function(isForWhite) {
  /** @type {HistoryService.GameSettings} */
  var recentSettings = this.storejs_.get(
      HistoryService.StorageKeyRecentSettings);
  if (recentSettings) {
    return isForWhite ?
           recentSettings.player_w :
           recentSettings.player_b;
  }
  return '';
};


/** @param {boolean} isForWhite */
HistoryService.prototype.rmMostRecentName = function(isForWhite) {
  var recentSettings = this.storejs_.get(
      HistoryService.StorageKeyRecentSettings);
  if (isForWhite) {
    delete recentSettings.player_w;
  } else {
    delete recentSettings.player_b;
  }
  this.storejs_.set(HistoryService.StorageKeyRecentSettings, recentSettings);
};


/**
 * @return {boolean}
 *     Whether there appears to be any preferences saved.
 */
HistoryService.prototype.haveSettingsSaved = function() {
  var settings = this.storejs_.get(HistoryService.StorageKeyRecentSettings);
  return settings && Object.keys(settings).length;
};



angular.
  module('chessLoggerApp').
  service('historyService', [
    'storejsService',
    HistoryService
  ]);
