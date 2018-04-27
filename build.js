var noop = require('noop-logger')
var releaseFolder = require('./util').releaseFolder
var gypbuild = require('./gypbuild')
var cmakebuild = require('./cmakebuild')
var collectArtifacts = require('./collect-artifacts')

function build (opts, version, cb) {
  var log = opts.log || noop
  var release = releaseFolder(opts, version)
  var build = opts.backend === 'cmake-js' ? cmakebuild : gypbuild

  log.verbose('starting build process ' + opts.backend)
  build(opts, version, function (err) {
    if (err) return cb(err)
    log.verbose('completed building' + opts.backend)
    collectArtifacts(release, opts, cb)
  })
}

module.exports = build
