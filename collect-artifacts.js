var fs = require('fs')
var path = require('path')
var error = require('./error')

module.exports = collectArtifacts

function readDirRecursiveSync(directory, relativeDir) {
  relativeDir = relativeDir || '';
  var collected
  var files = fs.readdirSync(directory, {withFileTypes: true})
  collected = files.map(function filterFiles(dirEnt){
    if(dirEnt.isFile()) return path.join(relativeDir, dirEnt.name)
  })
  collected = collected.concat(files.map(function filterFiles(dirEnt){
    if(dirEnt.isDirectory()) return readDirRecursiveSync(path.join(directory, dirEnt.name), path.join(relativeDir, dirEnt.name))
  }))
  return collected.reduce(function flatten(acc, file) {
    if(Array.isArray(file)){
      acc = acc.concat(file)
    } else if(file) {
      acc.push(file)
    }
    return acc
  }, [])
}

function collectArtifacts (release, opts, cb) {
  var fileExp = opts['include-regex']
  var files = readDirRecursiveSync(release)
  try {
    files = readDirRecursiveSync(release)
  } catch(err){
    return cb(err)
  }
  var collected = files.filter(function filterByRegex (filename) {
    return fileExp.test(filename)
  }).map(function addPath (filename) {
    return path.join(release, filename)
  })

  if (!collected.length) {
    return cb(error.noBuild(release))
  }

  cb(null, collected)
}
