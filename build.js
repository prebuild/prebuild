var path = require('path')
var fs = require('fs')
var install = require('node-gyp-install')
var releaseFolder = require('./util').releaseFolder
var runGyp = require('./gyp')

function build (opts, version, cb) {
  var release = releaseFolder(opts)

  install({log: opts.log, version: version}, function (err) {
    if (err) return cb(err)
    runGyp(opts, version, function (err) {
      if (err) return cb(err)
      done()
    })
  })

  function done () {
    fs.readdir(release, function (err, files) {
      if (err) return cb(err)

      for (var i = 0; i < files.length; i++) {
        if (/\.node$/i.test(files[i])) return cb(null, path.join(release, files[i]), files[i])
      }

      cb(new Error('Could not find build in ' + release))
    })
  }
}

module.exports = build
