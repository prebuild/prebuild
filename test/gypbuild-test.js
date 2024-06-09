const test = require('tape')
const runGyp = require('../gypbuild')
const build = require('../build')
const util = require('../util')
const noop = require('noop-logger')
const path = require('path')
const os = require('os')

test('gyp is invoked with correct arguments, release mode', function (t) {
  t.plan(7)
  const opts = {
    pkg: {
      binary: {
        module_name: 'module_name',
        module_path: 'module_path'
      }
    },
    arch: 'fooarch',
    gyp: {
      parseArgv: function (args) {
        t.deepEqual(args, ['node', 'index.js', 'rebuild', '--target=x.y.z', '--arch=fooarch'], 'correct arguments')
      },
      commands: {
        rebuild: function (args) {
          t.deepEqual(args, ['--rebuildarg'], 'correct args')
          opts.gyp.todo = [
            { name: 'clean', args: ['--cleanarg'] },
            { name: 'configure', args: ['--configurearg'] },
            { name: 'build', args: ['--buildarg'] }
          ]
          return new Promise(function (resolve) {
            process.nextTick(resolve)
          })
        },
        clean: function (args) {
          t.deepEqual(args, ['--cleanarg'], 'correct args')
          return new Promise(function (resolve) {
            process.nextTick(resolve)
          })
        },
        configure: function (args) {
          t.deepEqual(args, ['--configurearg', '-Dmodule_name=module_name', '-Dmodule_path=module_path'], 'correct args')
          return new Promise(function (resolve) {
            process.nextTick(resolve)
          })
        },
        build: function (args) {
          t.deepEqual(args, ['--buildarg'], 'correct args')
          return new Promise(function (resolve) {
            process.nextTick(resolve)
          })
        }
      },
      todo: [{ name: 'rebuild', args: ['--rebuildarg'] }]
    },
    log: noop
  }
  runGyp(opts, 'x.y.z', function (err) {
    const devDir = opts.gyp.devDir
    t.is(devDir, path.join(os.tmpdir(), 'prebuild', 'node'))
    t.error(err, 'no error')
  })
})

test('gyp is invoked with correct arguments, debug mode', function (t) {
  t.plan(2)
  const opts = {
    arch: 'fooarch',
    debug: true,
    gyp: {
      parseArgv: function (args) {
        t.deepEqual(args, ['node', 'index.js', 'rebuild', '--target=x.y.z', '--arch=fooarch', '--debug'], 'correct arguments')
      },
      commands: {
        rebuild: function (args) {
          t.deepEqual(args, ['--rebuildarg'], 'correct args')
          return Promise.resolve()
        }
      },
      todo: [{ name: 'rebuild', args: ['--rebuildarg'] }]
    },
    log: noop
  }
  runGyp(opts, 'x.y.z', function () {})
})

test('--preinstall script is spawned, calls back with error if fails', function (t) {
  t.plan(2)
  const _run = util.run
  util.run = function (cmd, cb) {
    t.equal(cmd, 'somescript.sh', 'correct script')
    process.nextTick(cb.bind(null, new Error('some error')))
  }
  const opts = {
    preinstall: 'somescript.sh',
    log: noop
  }
  build(opts, 'x.y.z', function (err) {
    t.equal(err.message, 'some error', 'correct error')
    util.run = _run
  })
})
