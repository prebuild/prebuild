var test = require('tape')
var exec = require('child_process').exec
var path = require('path')
var fs = require('fs')
var rm = require('rimraf')

var cwd = path.join(__dirname, 'native-module')

test('can install a native module', function (t) {
  rm.sync(path.join(cwd, 'build'))
  exec('npm install', { cwd: cwd }, function (error, stdout, stderr) {
    t.equal(error, null)
    t.equal(require('./native-module').hello(), 'world')
    t.end()
  })
})

test('can prebuild a native module for electron', function (t) {
  rm.sync(path.join(cwd, 'prebuilds'))
  var file = 'native-v1.0.0-electron-v50-' + process.platform + '-' + process.arch + '.tar.gz'
  var prebuild = path.join(cwd, 'prebuilds', file)
  exec('npm run prebuild', { cwd: cwd }, function (error, stdout, stderr) {
    t.equal(error, null)
    t.equal(fs.existsSync(prebuild), true)
    t.end()
  })
})
