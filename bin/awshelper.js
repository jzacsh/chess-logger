/**
 * @fileoverview
 * //@TODO: remove me!!    - write me!
 */
var helper = module.exports;


var awsSdk = require('aws-sdk');
var fs = require("fs");
var q = require("q");



/**
 * Default path we can expect to find AWS configuration.
 * @type {string}
 */
helper.DefaultAwsConfigFile = process.env.HOME + '/.aws/config';


helper.buildCallerRef = function() {
  return new Date().getTime();
};


/**
 * @param {string=} opt_configPath
 * @return {!Promise}
 *     Promise to resolve with a credited {@link AWS.CloudFront} instance.
 */
helper.buildAwsCloudFront = function(opt_configPath) {
  var deferred = q.defer();

  return helper.getAwsCredentials(opt_configPath).then(
      function(awsCredentials) {
        deferred.resolve(new awsSdk.CloudFront({credentials: awsCredentials}));
      },
      deferred.reject);
};


/**
 * @param {string=} opt_configPath
 * @return {!Promise}
 *     Promise to resolve with a map of AWS config data as found in local file,
 *     {@code configPath}. Keys to the map will be "secretAccessKey" and
 *     "accessKeyId"
 */
helper.getAwsCredentials = function(opt_configPath) {
  var deferred = q.defer();
  var configPath = opt_configPath || helper.DefaultAwsConfigFile;
  fs.readFile(configPath, {encoding: 'UTF-8'}, function(fsError, contents) {
    if (fsError) {
      console.error(fsError);
      deferred.reject(fsError);
      return;
    }

    /**
     * @param {string} key
     * @return {string}
     *     Value associated with {@code key}.
     */
    var scrapeValue = function(key) {
      var matches = contents.match(new RegExp(key + '=(.*)\\s'));
      if (!matches || !matches[1]) {
        throw new Error(
            'Could not find value for "' + key +
            '" in aws config file: ' + configPath);
      }
      return matches[1];
    };

    deferred.resolve(new awsSdk.Credentials(
        scrapeValue('aws_access_key_id'),
        scrapeValue('aws_secret_access_key')));
  });
  return deferred.promise;
};
