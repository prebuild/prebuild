const test = require('tape')
const exec = require('child_process').exec
const path = require('path')
const fs = require('fs')

const cwd = path.join(__dirname, 'native-module-cmake')

test('can prebuild a cmake-js native module for node', function (t) {
  fs.rmSync(path.join(cwd, 'prebuilds'), { recursive: true, force: true })
  const file = 'native-v1.0.0-node-v57-' + process.platform + '-' + process.arch + '.tar.gz'
  const prebuild = path.join(cwd, 'prebuilds', file)
  exec('npm run prebuild', { cwd }, function (error, stdout, stderr) {
    t.equal(error, null)
    t.equal(fs.existsSync(prebuild), true)
    t.end()
  })
})

test('can prebuild a cmake-js native module for electron', function (t) {
  fs.rmSync(path.join(cwd, 'prebuilds'), { recursive: true, force: true })
  const file = 'native-v1.0.0-electron-v50-' + process.platform + '-' + process.arch + '.tar.gz'
  const prebuild = path.join(cwd, 'prebuilds', file)
  exec('npm run prebuild-electron', { cwd }, function (error, stdout, stderr) {
    t.equal(error, null)
    t.equal(fs.existsSync(prebuild), true)
    t.end()
  })
})

test('can prebuild a cmake-js native module for node with silent argument', function (t) {
  fs.rmSync(path.join(cwd, 'prebuilds'), { recursive: true, force: true })
  const file = 'native-v1.0.0-node-v57-' + process.platform + '-' + process.arch + '.tar.gz'
  const prebuild = path.join(cwd, 'prebuilds', file)
  exec('npm run prebuild-silent', { cwd }, function (error, stdout, stderr) {
    // XXX: latest cmake-js has a forgotten console.log(process.argv)
    t.ok(stdout.trim().split('\n').length <= 12, 'stdout should be silent')
    t.equal(error, null)
    t.equal(fs.existsSync(prebuild), true)
    t.end()
  })
})
