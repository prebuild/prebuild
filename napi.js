'use strict'
var log = require('npmlog')
var path = require('path')
var pkg = require(path.resolve('package.json'))

var versionArray = process.version
  .substr(1)
  .replace(/-.*$/, '')
  .split('.')
  .map(function (item) {
    return +item
  })

module.exports.isNapiRuntime = function (runtime) {
  return runtime === 'napi'
}

module.exports.isSupportedVersion = function (napiVerison) {
  var version = parseInt(napiVerison, 10)
  return version <= getNapiVersion() && packageSupportsVersion(version)
}

var packageSupportsVersion = function (napiVerison) {
  if (pkg.binary && pkg.binary.napi_versions) {
    for (var i = 0; i < pkg.binary.napi_versions.length; i++) {
      if (pkg.binary.napi_versions[i] === napiVerison) return true
    };
  };
  return false
}

module.exports.logMissingNapiVersions = function (target, prebuild) {
  var targets = [].concat(target)
  targets.forEach(function (v) {
    if (!prebuildExists(prebuild, v)) {
      if (packageSupportsVersion(parseInt(v, 10))) {
        log.warn('This Node instance does not support N-API version', v)
      } else {
        log.warn('This package does not support N-API version', v)
      }
    }
  })
}

var prebuildExists = function (prebuild, version) {
  for (var i = 0; i < prebuild.length; i++) {
    if (prebuild[i].target === version) return true
  }
  return false
}

module.exports.getBestNapiBuildVersion = function () {
  var bestNapiBuildVersion = 0
  var napiBuildVersions = module.exports.getNapiBuildVersions(pkg)
  if (napiBuildVersions) {
    var ourNapiVersion = getNapiVersion()
    napiBuildVersions.forEach(function (napiBuildVersion) {
      if (napiBuildVersion > bestNapiBuildVersion &&
        napiBuildVersion <= ourNapiVersion) {
        bestNapiBuildVersion = napiBuildVersion
      }
    })
  }
  return bestNapiBuildVersion === 0 ? undefined : bestNapiBuildVersion
}

module.exports.getNapiBuildVersions = function () {
  var napiBuildVersions = []
  // remove duplicates, convert to text
  if (pkg.binary && pkg.binary.napi_versions) {
    pkg.binary.napi_versions.forEach(function (napiVersion) {
      var duplicated = napiBuildVersions.indexOf(napiVersion) !== -1
      if (!duplicated) {
        napiBuildVersions.push('' + napiVersion)
      }
    })
  }
  return napiBuildVersions.length ? napiBuildVersions : undefined
}

var getNapiVersion = function () {
  // returns the non-zero numeric napi version of the current node instance
  // or undefined if napi is not supported.
  var version = process.versions.napi // can be undefined
  if (!version) { // this code should never need to be updated
    if (versionArray[0] === 9 && versionArray[1] >= 3) version = 2 // 9.3.0+
    else if (versionArray[0] === 8) version = 1 // 8.0.0+
  }
  return version
}
