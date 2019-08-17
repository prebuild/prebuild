var fs = require('fs')
var waterfall = require('run-waterfall')
var getAbi = require('node-abi').getAbi
var getTarget = require('node-abi').getTarget
var napi = require('napi-build-utils')
var getTarPath = require('./util').getTarPath
var build = require('./build')
var strip = require('./strip')
var pack = require('./pack')

function prebuild (opts, target, runtime, callback) {
  var pkg = opts.pkg
  var buildLog = opts.buildLog || function () {}
  opts.target = target
  opts.runtime = runtime

  if (opts.runtime === 'node-webkit') {
    opts.backend = 'nw-gyp'
  }

  var buildLogMessage = 'Preparing to prebuild ' + pkg.name + '@' + pkg.version + ' for ' + runtime + ' ' + target + ' on ' + opts.platform + '-' + opts.arch + ' using ' + opts.backend
  if (opts.libc && opts.libc.length > 0) buildLogMessage += 'using libc ' + opts.libc
  buildLog(buildLogMessage)

  // --target can be target or abi
  if (!napi.isNapiRuntime(runtime)) target = getTarget(target, runtime)
  var abi = getAbi(target, runtime)

  var tarPath = getTarPath(opts, abi)
  fs.stat(tarPath, function (err, st) {
    if (!err && !opts.force) {
      buildLog(tarPath + ' exists, skipping build')
      return callback(null, tarPath)
    }
    var tasks = [
      function (cb) {
        build(opts, target, function (err, filenames) {
          if (err) return cb(err)
          cb(null, filenames)
        })
      },
      function (filenames, cb) {
        buildLog('Packing ' + filenames.join(', ') + ' into ' + tarPath)
        pack(filenames, tarPath, function (err) {
          if (err) return cb(err)
          buildLog('Prebuild written to ' + tarPath)
          cb(null, tarPath)
        })
      }
    ]

    if (opts.strip) {
      tasks.splice(1, 0, function (filename, cb) {
        buildLog('Stripping debug information from ' + filename)
        strip(filename, function (err) {
          if (err) return cb(err)
          cb(null, filename)
        })
      })
    }

    waterfall(tasks, callback)
  })
}

module.exports = prebuild
