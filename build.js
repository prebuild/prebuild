var path = require('path')
var fs = require('fs')
var install = require('node-gyp-install')
var nodeGyp = require('node-gyp')()
var spawn = require('./util').spawn

function build (opts, version, cb) {
  var binary = opts.pkg.binary
  var release = (binary && binary.module_path) || 'build/Release'

  install({log: opts.log, version: version}, function (err) {
    if (err) return cb(err)
    runGyp(opts, version, function (err) {
      if (err) return cb(err)
      done()
    })
  })

  function done () {
    fs.readdir(release, function (err, files) {
      if (err) return cb(err)

      for (var i = 0; i < files.length; i++) {
        if (/\.node$/i.test(files[i])) return cb(null, path.join(release, files[i]), files[i])
      }

      cb(new Error('Could not find build in ' + release))
    })
  }
}

function runGyp (opts, version, cb) {
  var gyp = opts.gyp || nodeGyp
  if (!opts.rc.preinstall) return run()

  spawn(opts.rc.preinstall, function (err) {
    if (err) return cb(err)
    run()
  })

  function run () {
    gyp.parseArgv(['node', 'index.js', 'rebuild', '--target=' + version, '--target_arch=' + opts.rc.arch])
    if (opts.rc.verbose) opts.log.level = undefined
    gyp.commands.rebuild(gyp.todo.shift().args, function run (err) {
      if (err) return cb(err)
      if (!gyp.todo.length) return cb()
      if (gyp.todo[0].name === 'configure') configurePreGyp(gyp, opts)
      gyp.commands[gyp.todo[0].name](gyp.todo.shift().args, run)
    })
  }
}

function configurePreGyp (gyp, opts) {
  var binary = opts.pkg.binary
  if (binary && binary.module_name) {
    gyp.todo[0].args.push('-Dmodule_name=' + binary.module_name)
  }
  if (binary && binary.module_path) {
    gyp.todo[0].args.push('-Dmodule_path=' + binary.module_path)
  }
}

module.exports = build
