#!/usr/bin/env node
/**
 * @fileoverview POST requests cache invalidation to Amazon Cloudfront.
 * For more, see API:
 * http://docs.aws.amazon.com/AmazonCloudFront/latest/APIReference/CreateInvalidation.html
 */
var fs = require("fs");
var q = require("q");
var awsSdk = require('aws-sdk');
var awsHelper = require('./awshelper');

var awsCallerRef = awsHelper.buildCallerRef();

// Read optiosn
var args = process.argv.slice(2);
var fileList = args[0];
var awsDistributionId = args[1];
var awsCredentials;


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

  awsHelper.buildAwsCloudFront().then(function(cloudFront) {
    var invalidationBody = {
      DistributionId: awsDistributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: invalidPaths.length,
          Items: invalidPaths
        },
        CallerReference:  String(awsCallerRef)
      }
    };

    cloudFront.createInvalidation(invalidationBody, function(err, data) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(data);
      }
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

        var paths = contents.split('\n').filter(function(path) {
          return !!path;
        });
        deferred.resolve(paths);
      });
  return deferred.promise;
};


/**
 * Description of the less obvious, and more important properties of
 * {@code resp}, pasted from:
 * http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudFront.html#createInvalidation-property
 *
 * <ul>
 *   <li>Location:
 *     The fully qualified URI of the distribution and invalidation batch
 *     request, including the Invalidation ID.
 *   <li>Id:
 *     The identifier for the invalidation request. For example:
 *     IDFDVBD632BHDS5.
 *   <li>Status:
 *     The status of the invalidation request. When the invalidation batch is
 *     finished, the status is Completed.
 * </ul>
 *
 * @param {{
 *     Location: string,
 *     Id: string,
 *     Status: string
 *     CreateTime: !Date,
 *     InvalidationBatch: {
 *       Paths: {Quantity: number, Items: !Array.<string>},
 *       CallerReference: string
 *     }}} resp
 */
var invalidationSuccessHandler = function(resp) {
  console.log('SUCCESS\n\nCache invalidation started...');
  console.log('\tRequest URI:\t%s', resp.Location);
  console.log('\tcaller ref:\t%s', awsCallerRef);
  console.log('\tinvalidationId\t%s', resp.Id);
};


/** @param {!Object} error */
var invalidationErrorHanalder = function(error) {
  console.log('FAILURE\tCache invalidation failed, reason:');
  console.error(error);
};


getCacheInvalidationList(fileList).
    then(requestAwsCacheInvalidation).
    then(invalidationSuccessHandler, invalidationErrorHanalder);
