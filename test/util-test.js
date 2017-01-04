var test = require('tape')
var cp = require('child_process')
var EventEmitter = require('events').EventEmitter
var util = require('../util')
var error = require('../error')

var spawn = util.spawn

test('getTarPath based on package.json and rc config', function (t) {
  var opts = {
    pkg: {
      name: 'foo',
      version: 'X.Y.Z'
    },
    platform: 'fakeos',
    arch: 'x64'
  }
  var tarPath = util.getTarPath(opts, 314)
  t.equal(tarPath, 'prebuilds/foo-vX.Y.Z-node-v314-fakeos-x64.tar.gz', 'correct tar path')
  t.end()
})

// skipping these 3 tests as it is using execspawn now

test.skip('spawn(): no args default to empty array', function (t) {
  cp.spawn = function (cmd, args, opts) {
    t.equal(cmd, 'foo', 'correct command')
    t.same(args, [], 'default args')
    t.same(opts, {stdio: 'inherit'}, 'inherit stdio')
    return {
      on: function (id, cb) {
        t.equal(id, 'exit', 'listener on exit event')
        t.end()
      }
    }
  }
  spawn('foo')
})

test.skip('spawn(): callback fires with no error on exit code 0', function (t) {
  cp.spawn = function (cmd, args, opts) {
    t.same(args, ['arg1', 'arg2'], 'correct args')
    return new EventEmitter()
  }
  spawn('foo', ['arg1', 'arg2'], function (err) {
    t.error(err, 'no error')
    t.end()
  }).emit('exit', 0)
})

test.skip('spawn(): callback fires with error on non 0 exit code', function (t) {
  cp.spawn = function () { return new EventEmitter() }
  spawn('foo', ['arg1'], function (err) {
    t.same(err, error.spawnFailed('foo', ['arg1'], 314))
    t.end()
  }).emit('exit', 314)
})

test('releaseFolder(): depends on package.json and --debug', function (t) {
  var folder = util.releaseFolder
  t.equal(folder({pkg: {}}), 'build/Release', 'Release is default')
  t.equal(folder({
    debug: false,
    pkg: {}
  }), 'build/Release', 'Release is default')
  t.equal(folder({
    debug: true,
    pkg: {}
  }), 'build/Debug', 'Debug folder when --debug')
  t.equal(folder({
    debug: true,
    pkg: { binary: { module_path: 'foo/bar' } }
  }), 'foo/bar', 'using binary property from package.json')
  t.end()
})
