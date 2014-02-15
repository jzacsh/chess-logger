#!/usr/bin/env node
/**
 * @fileoverview POST requests cache invalidation to Amazon Cloudfront.
 * For more, see API:
 * http://docs.aws.amazon.com/AmazonCloudFront/latest/APIReference/CreateInvalidation.html
 */
var fs = require("fs");
var q = require("q");
var awsSdk = require('aws-sdk');

var awsCallerRef = new Date().getTime();
var awsConfigFile = process.env.HOME + '/.aws/config';

// Read optiosn
var args = process.argv.slice(2);
var fileList = args[0];
var awsDistributionId = args[1];
var awsCredentials;


/**
 * @param {string} configPath
 * @return {!Promise}
 *     Promise to resolve with a map of AWS config data as found in local file,
 *     {@code configPath}. Keys to the map will be "secretAccessKey" and
 *     "accessKeyId"
 */
var getAwsConfig = function(configPath) {
  var deferred = q.defer();
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

    awsCredentials = new awsSdk.Credentials(
        scrapeValue('aws_access_key_id'),
        scrapeValue('aws_secret_access_key'));
    deferred.resolve(true);
  });
  return deferred.promise;
};


/**
 * For more:
 * http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudFront.html#createInvalidation-property
 *
 * @param {!Array.<string>} invalidPaths
 *     AWS s3 relative paths to files recently updated.
 * @return {!Promise}
 *     Promise to have made an s3 invalidation request based on
 *     {@code awsRequest}
 */
var requestAwsCacheInvalidation = function(invalidPaths) {
  var deferred = q.defer();

  getAwsConfig(awsConfigFile).then(function() {
    var cleanedUpPaths = invalidPaths.filter(function(path) {
      return !!path;
    });
    var invalidationBody = {
      DistributionId: awsDistributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: cleanedUpPaths.length,
          Items: cleanedUpPaths
        },
        CallerReference:  String(awsCallerRef)
      }
    };

    console.log('creating invalidation request; caller ref:\t', awsCallerRef);
    new awsSdk.CloudFront({credentials: awsCredentials}).
        createInvalidation(invalidationBody, function(err, data) {
          if (err) {
            console.error('aws-sdk CloudFront#createInvalidation');
            console.error(err);
            deferred.reject();
            return;
          }
          deferred.resolve(data);
        });
  }, deferred.reject);

  return deferred.promise;
};


/**
 * @param {string} invalidationList
 *     File containing a line-break delimeted list of server-side AWS s3 paths
 *     for which caches are no longer valid.
 * @return {!Promise}
 *     Promise to resolve with an {@link Array} of file paths as strings.
 */
var getCacheInvalidationList = function(invalidationList) {
  if (!invalidationList.length) {
    throw new Error('No file paths provided to invalidate.');
  }
  var deferred = q.defer();

  fs.readFile(
      invalidationList, {encoding: 'UTF-8'},
      function(fsError, contents) {
        if (fsError) {
          console.error(fsError);
          deferred.reject(fsError);
          return;
        }
        deferred.resolve(contents.split('\n'));
      });
  return deferred.promise;
};


getCacheInvalidationList(fileList).then(requestAwsCacheInvalidation);
