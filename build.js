var noop = require('noop-logger')
var releaseFolder = require('./util').releaseFolder
var gypbuild = require('./gypbuild')
var cmakebuild = require('./cmakebuild')
var collectArtifacts = require('./collect-artifacts')
var util = require('./util')

function build (opts, version, cb) {
  var log = opts.log || noop

  var run = function () {
    var release = releaseFolder(opts, version)
    var build = opts.backend === 'cmake-js' ? cmakebuild : gypbuild

    log.verbose('starting build process ' + opts.backend)
    build(opts, version, function (err) {
      if (err) return cb(err)
      log.verbose('completed building ' + opts.backend)

      if (!opts.prepack) return collectArtifacts(release, opts, cb)

      log.verbose('executing prepack')
      util.run(opts.prepack, function (err) {
        if (err) return cb(err)
        collectArtifacts(release, opts, cb)
      })
    })
  }

  if (!opts.preinstall) return run()

  log.verbose('executing preinstall')
  util.run(opts.preinstall, function (err) {
    if (err) return cb(err)
    run()
  })
}

module.exports = build
