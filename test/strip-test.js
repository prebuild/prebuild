const test = require('tape')
const strip = require('../strip')
const util = require('../util')

test('strip is noop on windows', function (t) {
  const _spawn = util.spawn
  util.spawn = function (cmd, args, cb) {
    t.fail('should not be called')
  }
  const _platform = util.platform
  util.platform = function () { return 'win32' }
  strip(['foo.node'], function (err) {
    util.spawn = _spawn
    util.platform = _platform
    t.error(err, 'no error')
    t.end()
  })
})

test('strip gets special args for darwin', function (t) {
  t.plan(3)
  const _spawn = util.spawn
  util.spawn = function (cmd, args, cb) {
    t.equal(cmd, 'strip', 'correct cmd')
    t.deepEqual(args, ['foo.node', '-Sx'], 'correct args')
    process.nextTick(cb)
  }
  const _platform = util.platform
  util.platform = function () { return 'darwin' }
  strip(['foo.node'], function (err) {
    util.spawn = _spawn
    util.platform = _platform
    t.error(err, 'no error')
    t.end()
  })
})

test('strip gets special args for linux', function (t) {
  t.plan(3)
  const _spawn = util.spawn
  util.spawn = function (cmd, args, cb) {
    t.equal(cmd, 'strip', 'correct cmd')
    t.deepEqual(args, ['foo.node', '--strip-all'], 'correct args')
    process.nextTick(cb)
  }
  const _platform = util.platform
  util.platform = function () { return 'linux' }
  strip(['foo.node'], function (err) {
    util.spawn = _spawn
    util.platform = _platform
    t.error(err, 'no error')
    t.end()
  })
})

test('strip gets empty args for other', function (t) {
  t.plan(3)
  const _spawn = util.spawn
  util.spawn = function (cmd, args, cb) {
    t.equal(cmd, 'strip', 'correct cmd')
    t.deepEqual(args, [], 'correct args')
    process.nextTick(cb)
  }
  const _platform = util.platform
  util.platform = function () { return 'sunos' }
  strip(['foo.node'], function (err) {
    util.spawn = _spawn
    util.platform = _platform
    t.error(err, 'no error')
    t.end()
  })
})

test('strip gets special args for linux on multiple files', function (t) {
  t.plan(5)
  const collectedFiles = ['foo.node', 'bar.node']
  let currentFileIndex = 0
  const _spawn = util.spawn
  util.spawn = function (cmd, args, cb) {
    t.equal(cmd, 'strip', 'correct cmd')
    const expectedFile = collectedFiles[currentFileIndex]
    t.deepEqual(args, [expectedFile, '--strip-all'], 'correct args')
    process.nextTick(cb)
    currentFileIndex++
  }
  const _platform = util.platform
  util.platform = function () { return 'linux' }
  strip(collectedFiles, function (err) {
    util.spawn = _spawn
    util.platform = _platform
    t.error(err, 'no error')
    t.end()
  })
})
