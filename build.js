var noop = require('noop-logger')
var releaseFolder = require('./util').releaseFolder
var gypbuild = require('./gypbuild')
var collectArtifacts = require('./collect-artifacts')

function build (opts, version, cb) {
  var log = opts.log || noop
  var release = releaseFolder(opts, version)

  log.verbose('starting node-gyp process')
  gypbuild(opts, version, function (err) {
    if (err) return cb(err)
    log.verbose('done node-gyp\'ing')
    collectArtifacts(release, opts, cb)
  })
}

module.exports = build
