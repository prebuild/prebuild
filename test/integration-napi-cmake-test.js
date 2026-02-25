const test = require('tape')
const exec = require('child_process').exec
const path = require('path')
const fs = require('fs')

const cwd = path.join(__dirname, 'native-module-napi-cmake')

test('can prebuild a cmake napi module for node', function (t) {
  fs.rmSync(path.join(cwd, 'prebuilds'), { recursive: true, force: true })
  const file = 'native-v1.0.0-napi-v1-' + process.platform + '-' + process.arch + '.tar.gz'
  const prebuild = path.join(cwd, 'prebuilds', file)
  exec('npm run prebuild', { cwd }, function (error, stdout, stderr) {
    t.equal(error, null)
    t.equal(fs.existsSync(prebuild), true)
    t.end()
  })
})

test('can prebuild a cmake napi module for node with prepack script', function (t) {
  fs.rmSync(path.join(cwd, 'prebuilds'), { recursive: true, force: true })
  const file = 'native-v1.0.0-napi-v1-' + process.platform + '-' + process.arch + '.tar.gz'
  const prebuild = path.join(cwd, 'prebuilds', file)
  exec('npm run prebuild-prepack', { cwd }, function (error, stdout, stderr) {
    t.equal(error, null)
    t.equal(fs.existsSync(prebuild), true)
    t.end()
  })
})
