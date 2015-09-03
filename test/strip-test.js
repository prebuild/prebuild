var test = require('tape')
var strip = require('../strip')
var util = require('../util')

test('strip is noop on windows', function (t) {
  var _spawn = util.spawn
  util.spawn = function (cmd, args, cb) {
    t.fail('should not be called')
  }
  var _platform = util.platform
  util.platform = function () { return 'win32' }
  strip('foo.node', function (err) {
    util.spawn = _spawn
    util.platform = _platform
    t.error(err, 'no error')
    t.end()
  })
})

test('strip gets special args for darwin', function (t) {
  t.plan(3)
  var _spawn = util.spawn
  util.spawn = function (cmd, args, cb) {
    t.equal(cmd, 'strip', 'correct cmd')
    t.deepEqual(args, ['foo.node', '-Sx'], 'correct args')
    process.nextTick(cb)
  }
  var _platform = util.platform
  util.platform = function () { return 'darwin' }
  strip('foo.node', function (err) {
    util.spawn = _spawn
    util.platform = _platform
    t.error(err, 'no error')
    t.end()
  })
})

test('strip gets special args for linux', function (t) {
  t.plan(3)
  var _spawn = util.spawn
  util.spawn = function (cmd, args, cb) {
    t.equal(cmd, 'strip', 'correct cmd')
    t.deepEqual(args, ['foo.node', '--strip-all'], 'correct args')
    process.nextTick(cb)
  }
  var _platform = util.platform
  util.platform = function () { return 'linux' }
  strip('foo.node', function (err) {
    util.spawn = _spawn
    util.platform = _platform
    t.error(err, 'no error')
    t.end()
  })
})

test('strip gets empty args for other', function (t) {
  t.plan(3)
  var _spawn = util.spawn
  util.spawn = function (cmd, args, cb) {
    t.equal(cmd, 'strip', 'correct cmd')
    t.deepEqual(args, [], 'correct args')
    process.nextTick(cb)
  }
  var _platform = util.platform
  util.platform = function () { return 'sunos' }
  strip('foo.node', function (err) {
    util.spawn = _spawn
    util.platform = _platform
    t.error(err, 'no error')
    t.end()
  })
})
