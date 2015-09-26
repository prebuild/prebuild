var fs = require('fs')
var async = require('async')
var getAbi = require('./abi')
var getTarPath = require('./util').getTarPath
var build = require('./build')
var strip = require('./strip')
var pack = require('./pack')

function prebuild (opts, target, callback) {
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
        return callback(null, tarPath)
      }
      var tasks = [
        function (cb) {
          build(opts, target, function (err, filename) {
            if (err) return cb(err)
            cb(null, filename)
          })
        },
        function (filename, cb) {
          buildLog('Packing ' + filename + ' into ' + tarPath)
          pack(filename, tarPath, function (err) {
            if (err) return cb(err)
            cb(null)
          })
        }
      ]

      if (rc.strip) {
        tasks.splice(1, 0, function (filename, cb) {
          buildLog('Stripping debug information from ' + filename)
          strip(filename, function (err) {
            if (err) return cb(err)
            cb(null, filename)
          })
        })
      }

      // TODO if we can move out buildLog() to the caller, we can simply do
      // async.waterfall(tasks, callback)
      async.waterfall(tasks, function (err) {
        if (err) return callback(err)
        buildLog('Prebuild written to ' + tarPath)
        callback(null, tarPath)
      })
    })
  })
}

module.exports = prebuild
