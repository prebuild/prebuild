var path = require('path')
var fs = require('fs')
var noop = require('noop-logger')
var releaseFolder = require('./util').releaseFolder
var gypbuild = require('./gypbuild')
var error = require('./error')

function build (opts, version, cb) {
  var log = opts.log || noop
  var fileExp = opts['collect-files-filter']
  var release = releaseFolder(opts, version)

  log.verbose('starting node-gyp process')
  gypbuild(opts, version, function (err) {
    if (err) return cb(err)
    log.verbose('done node-gyp\'ing')
    done()
  })

  function done () {
    fs.readdir(release, function (err, files) {
      if (err) return cb(err)

      var collected = files.filter(function filterByRegex (filename) {
        return fileExp.test(filename)
      }).map(function addPath (filename) {
        return path.join(release, filename)
      })

      if (!collected.length) {
        return cb(error.noBuild(release))
      }

      cb(null, collected)
    })
  }
}

module.exports = build
