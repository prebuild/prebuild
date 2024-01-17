const noop = require('noop-logger')
const releaseFolder = require('./util').releaseFolder
const gypbuild = require('./gypbuild')
const cmakebuild = require('./cmakebuild')
const collectArtifacts = require('./collect-artifacts')
const util = require('./util')

function build (opts, version, cb) {
  const log = opts.log || noop

  const run = function () {
    const release = releaseFolder(opts, version)
    const build = opts.backend === 'cmake-js' ? cmakebuild : gypbuild

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
