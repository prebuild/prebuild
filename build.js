var path = require('path')
var fs = require('fs')
var noop = require('noop-logger')
var releaseFolder = require('./util').releaseFolder
var gypbuild = require('./gypbuild')
var error = require('./error')

function build (opts, version, cb) {
  var log = opts.log || noop
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
      var nodeFiles = [];
      for (var i = 0; i < files.length; i++) {
        if (/\.node$/i.test(files[i])) {
          nodeFiles.push(path.join(release, files[i]))
        }
      }
      if (nodeFiles.length === 0) {
        return cb(error.noBuild(release))
      }
      return cb(null, nodeFiles)
    })
  }
}

module.exports = build
