const fs = require('fs')
const path = require('path')
const error = require('./error')

module.exports = collectArtifacts

function collectArtifacts (release, opts, cb) {
  const fileExp = opts['include-regex']
  fs.readdir(release, function (err, files) {
    if (err) return cb(err)

    const collected = files.filter(function filterByRegex (filename) {
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
