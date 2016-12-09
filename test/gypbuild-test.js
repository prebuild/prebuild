var test = require('tape')
var runGyp = require('../gypbuild')
var util = require('../util')
var noop = require('noop-logger')

test('node-gyp script is spawned, calls back with error if fails', function (t) {
  t.plan(2)
  var _exec = util.exec
  util.exec = function (cmd, cb) {
    var command = 'node-gyp rebuild --target=x.y.z --target_arch=fooarch'
    t.equal(cmd, command, 'correct command')
    process.nextTick(cb.bind(null, new Error('node-gyp error')))
  }
  var opts = {
    arch: 'fooarch',
    log: noop
  }
  runGyp(opts, 'x.y.z', function (err) {
    t.equal(err.message, 'node-gyp error', 'correct error')
    util.exec = _exec
  })
})

test('node-gyp script is spawned, respects runtime and debug setting', function (t) {
  t.plan(2)
  var _exec = util.exec
  util.exec = function (cmd, cb) {
    var command = 'node-gyp rebuild --target=x.y.z --target_arch=fooarch --runtime=electron --dist-url=https://atom.io/download/electron --debug'
    t.equal(cmd, command, 'correct command')
    process.nextTick(cb.bind(null, new Error('node-gyp error')))
  }
  var opts = {
    arch: 'fooarch',
    runtime: 'electron',
    debug: true,
    log: noop
  }
  runGyp(opts, 'x.y.z', function (err) {
    t.equal(err.message, 'node-gyp error', 'correct error')
    util.exec = _exec
  })
})

test('--preinstall script is spawned, calls back with error if fails', function (t) {
  t.plan(2)
  var _exec = util.exec
  util.exec = function (cmd, cb) {
    t.equal(cmd, 'somescript.sh', 'correct script')
    process.nextTick(cb.bind(null, new Error('some error')))
  }
  var opts = {
    preinstall: 'somescript.sh',
    log: noop
  }
  runGyp(opts, 'x.y.z', function (err) {
    t.equal(err.message, 'some error', 'correct error')
    util.exec = _exec
  })
})
