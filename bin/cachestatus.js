#!/usr/bin/env node

var fs = require("fs");
var awsSdk = require('aws-sdk');
var awsHelper = require('./awshelper');

var args = process.argv.slice(2);


var distributionIdArg = 0;
var invalidationIdArg = 1;

var distributionId = String(args[distributionIdArg]);
if (!distributionId) {
  throw new Error(
      'Expected DistributionID as argument[' + distributionIdArg +
      '] to script.');
}

var invalidationId = String(args[invalidationIdArg]);
if (!invalidationId || invalidationId === 'undefined') {
  throw new Error(
      'Expected InvalidationID as argument[' + invalidationIdArg +
      '] to script.');
}

awsHelper.buildAwsCloudFront().then(function(cloudFront) {
  var requestBody = {
    DistributionId: distributionId,
    Id: invalidationId
  };
  cloudFront.getInvalidation(requestBody, function(err, data) {
    if (err) {
      console.error(err);
    } else {
      console.log(
          'Cache Invalidation STATUS:\n\tcreated:\t%s\n\tstatus :\t%s\n',
          data.CreateTime,
          data.Status);
    }
  });
});
