var fs = require('fs')
var path = require('path')
var error = require('./error')

module.exports = collectArtifacts

function collectArtifacts (release, opts, cb) {
  var fileExp = opts['include-regex']
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
