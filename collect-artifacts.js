var path = require('path')
var error = require('./error')
var recursive = require('recursive-readdir')

module.exports = collectArtifacts

function collectArtifacts (release, opts, cb) {
  var fileExp = opts['include-regex']
  recursive(release, function (err, files) {
    if (err) return cb(err)

    var collected = files.filter(function filterByRegex (filename) {
      return fileExp.test(path.relative(release, filename))
    })

    if (!collected.length) {
      return cb(error.noBuild(release))
    }

    cb(null, collected)
  })
}
