var test = require('tape')
var runGyp = require('../gypbuild')
var build = require('../build')
var util = require('../util')
var noop = require('noop-logger')
var osenv = require('osenv')

test('gyp is invoked with correct arguments, release mode', function (t) {
  t.plan(7)
  var opts = {
    pkg: {binary: {
      module_name: 'module_name',
      module_path: 'module_path'
    }},
    arch: 'fooarch',
    gyp: {
      parseArgv: function (args) {
        t.deepEqual(args, ['node', 'index.js', 'rebuild', '--target=x.y.z', '--target_arch=fooarch'], 'correct arguments')
      },
      commands: {
        rebuild: function (args, cb) {
          t.deepEqual(args, ['--rebuildarg'], 'correct args')
          opts.gyp.todo = [
            {name: 'clean', args: ['--cleanarg']},
            {name: 'configure', args: ['--configurearg']},
            {name: 'build', args: ['--buildarg']}
          ]
          process.nextTick(cb)
        },
        clean: function (args, cb) {
          t.deepEqual(args, ['--cleanarg'], 'correct args')
          process.nextTick(cb)
        },
        configure: function (args, cb) {
          t.deepEqual(args, ['--configurearg', '-Dmodule_name=module_name', '-Dmodule_path=module_path'], 'correct args')
          process.nextTick(cb)
        },
        build: function (args, cb) {
          t.deepEqual(args, ['--buildarg'], 'correct args')
          process.nextTick(cb)
        }
      },
      todo: [{ name: 'rebuild', args: [ '--rebuildarg' ] }]
    },
    log: noop
  }
  runGyp(opts, 'x.y.z', function (err) {
    var devDir = opts.gyp.devDir
    t.equal(devDir.indexOf(osenv.home()), 0, devDir + ' should start with home folder')
    t.error(err, 'no error')
  })
})

test('gyp is invoked with correct arguments, debug mode', function (t) {
  t.plan(2)
  var opts = {
    arch: 'fooarch',
    debug: true,
    gyp: {
      parseArgv: function (args) {
        t.deepEqual(args, ['node', 'index.js', 'rebuild', '--target=x.y.z', '--target_arch=fooarch', '--debug'], 'correct arguments')
      },
      commands: {
        rebuild: function (args, cb) {
          t.deepEqual(args, ['--rebuildarg'], 'correct args')
        }
      },
      todo: [{ name: 'rebuild', args: ['--rebuildarg'] }]
    },
    log: noop
  }
  runGyp(opts, 'x.y.z')
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
  build(opts, 'x.y.z', function (err) {
    t.equal(err.message, 'some error', 'correct error')
    util.exec = _exec
  })
})
