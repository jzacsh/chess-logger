'use strict';



/**
 * @param {!angular.$document} document
 * @param {!angular.$q} q
 * @param {!angular.$window} window
 * @param {string} clientId
 * @constructor
 */
var GdriveHistoryService = function GdriveHistoryService(
    document, q, window, clientId) {
  /** @private {!angular.$document} */
  this.document_ = document;

  /** @private {!angular.$q} */
  this.q_ = q;

  /** @private {!angular.$window} */
  this.window_ = window;

  /** @private {boolean} */
  this.isAvailable_ = false;

  /** @private {string} */
  this.clientId_ = clientId;

  /** @private {?boolean} */
  this.isReady_ = null;

  // TODO(zacsh): Consider removing this
  this.loadGoogleApi();
};


/**
 * Drive "API scope" declaring this service's access.
 *
 * See https://developers.google.com/drive/web/scopes for more.
 * @type {string}
 * @private
 */
GdriveHistoryService.AppdataScope_ = 'drive.appdata';


/**
 * Client javascript provided by Google APIs.
 *
 * See Step #1 "sample" for more:
 * https://developers.google.com/drive/web/quickstart/quickstart-js
 *
 * @type {string}
 * @private
 */
GdriveHistoryService.ApiClientLib_ = 'https://apis.google.com/js/client.js';


/**
 * {@link Window}-global handler used to load Google javascript lib.
 *
 * @type {string}
 * @private
 */
GdriveHistoryService.ApiLibCallback_ = 'gdriveHistoryServiceHandler';


/**
 * Loads {@link gapi.client} API lib from Google API CDN.
 *
 * @return {!angular.$q.Promise}
 */
GdriveHistoryService.prototype.loadGoogleApi = function() {
  if (this.isAvailable_) {
    return this.q_.when();
  } else {
    var deferred = this.q_.defer();

    var jsLibUrl = GdriveHistoryService.ApiClientLib_ +
        '?onload=' + GdriveHistoryService.ApiLibCallback_;
    /** @type {!Element} */
    var jsLibScriptEl = angular.element('<script></script>');
    jsLibScriptEl.attr('type', 'text/javascript');
    jsLibScriptEl.attr('src', jsLibUrl);

    this.window_[GdriveHistoryService.ApiLibCallback_] = angular.
        bind(this, function() {
          this.isAvailable_ = true;
          deferred.resolve();
          return;  // Ensure we don't confuse Goog APIs by returning Promise
        });
    angular.element('body').append(jsLibScriptEl);

    return deferred.promise;
  }
};


/**
 * Checks if current user is authenticated and has granted access OAuth.
 *
 * @param {boolean} promptUser
 * @return {!angular.$q.Promise}
 */
GdriveHistoryService.prototype.loadAuthorization = function(promptUser) {
   if (!this.isAvailable_) {
     throw new Error(
         'API calls not possible without first successfully auhorizing user.');
   }

  this.isReady_ = false;
  var authParams = {
    client_id: this.clientId_,
    scope: 'https://www.googleapis.com/auth/' +
        GdriveHistoryService.AppdataScope_,
    immediate: !promptUser
  };
  var deferred = this.q_.defer();
  gapi.auth.authorize(authParams, angular.bind(this, function(response) {
    var seemsAuthorized = !!(response && !response.error);
    if (seemsAuthorized) {
      gapi.client.load('drive', 'v2', angular.bind(this, function() {
        this.isReady_ = true;
        deferred.resolve();
      }));
    } else {
      deferred.reject(response ? response.error : 'No Google API resposne');
    }
  }));
  return deferred.promise;
};


/**
 * Throws {@link Error} if API is not loaded.
 */
GdriveHistoryService.prototype.assertApiAvailable = function() {
   if (!this.isReady_) {
     throw new Error(
         'API calls not possible without first successfully auhorizing user.');
   }
};


/**
 * NOTE: Authorization can be reattempted with {@link #loadAuthorization}.
 * @return {!angular.$q.Promise}
 *     Whether service the current service has loaded {@link gapi} and has been
 *     authorized to call Google Drive APIs on behalf of the current user.
 */
GdriveHistoryService.prototype.isAuthorized = function() {
  var deferred = this.q_.defer();
  if (this.isReady_ === null) {
    this.loadGoogleApi().then(
        angular.bind(this, function() {
          this.loadAuthorization(false  /* prompt user */).then(
              angular.bind(this, deferred.resolve),
              angular.bind(this, deferred.reject, 'loadAuth Failed:\t'));
        }),
        angular.bind(this, deferred.reject, 'loadApi Failed:\t'));
  } else {
    if (this.isReady_) {
      deferred.resolve();
    } else {
      deferred.reject('not yet authorized');
    }
  }
  return deferred.promise;
};


/**
 * TODO(zacsh): finish writing, see:
 * https://developers.google.com/drive/web/appdata
 *
 * @param {string} fileName
 * @param {string} fileContents
 * @return {!angular.$q.Promise}
 */
GdriveHistoryService.prototype.writeData = function(fileName, fileContents) {
  this.assertApiAvailable();

  var request = {resource: {
    mimeType: 'text/plain',
    title: fileName,
    writersCanShare: true,
    parents: ['PgnDumps'],
    kind: 'drive#appdata',
    body: fileContents
  }};

  var deferred = this.q_.defer();
  gapi.client.drive.files.insert(request).execute(deferred.resolve);
  return deferred.promise;
};



/**
 * @constructor
 * @ngInject
 */
var GdriveHistoryProvider = function GdriveHistoryProvider() {
  /**
   * @type {!Array.<(string|function)>}
   */
  this.$get = [
    '$document',
    '$q',
    '$window',
    angular.bind(this, this.get)
  ];

  /** @private {?string} */
  this.clientId_ = null;
};


/**
 * Sets Google Drive API "CLIENT ID" for OAuth 2.0 access.
 *
 * See https://developers.google.com/console/help/new/#usingkeys for more.
 *
 * @param {string} clientId
 * @return {!GdriveHistoryProvider}
 */
GdriveHistoryProvider.prototype.setClientId = function(clientId) {
  this.clientId_ = clientId;
  return this;
};


/**
 * @param {!angular.$document} $document
 * @param {!angular.$q} $q
 * @param {!angular.$window} $window
 * @return {!Object}
 *     Instance of {@link GdriveHistoryService}.
 */
GdriveHistoryProvider.prototype.get = function($document, $q, $window) {
  if (!this.clientId_) {
    throw new Error('Must set GoogleDrive "CLIENT ID".');
  }

  return new GdriveHistoryService(
      $document, $q, $window, this.clientId_);
};


angular.
    module('chessLoggerApp').
    provider('gdriveHistoryService', [
      GdriveHistoryProvider
    ]);
