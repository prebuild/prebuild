var fs = require('fs')
var path = require('path')
var install = require('node-gyp-install')
var getAbi = require('./abi')
var getTarPath = require('./util').getTarPath
var build = require('./build')
var pack = require('./pack')

function prebuild (opts, target, cb) {
  var pkg = opts.pkg
  var rc = opts.rc
  var log = opts.log
  var buildLog = opts.buildLog || function () {}

  if (target[0] !== 'v') target = 'v' + target
  buildLog('Preparing to prebuild ' + pkg.name + '@' + pkg.version + ' for ' + target + ' on ' + rc.platform + '-' + rc.arch)
  getAbi(opts, target, function (err, abi) {
    if (err) return log.error('build', err.message)
    var tarPath = getTarPath(opts, abi)
    fs.stat(tarPath, function (err, st) {
      if (!err && !rc.force) {
        buildLog(tarPath + ' exists, skipping build')
        return cb(null, tarPath)
      }
      build(opts, target, function (err, filename) {
        if (err) return cb(err)
        pack(filename, tarPath, function (err) {
          if (err) return cb(err)
          buildLog('Prebuild written to ' + tarPath)
          cb(null, tarPath)
        })
      })
    })
  })
}

module.exports = prebuild
