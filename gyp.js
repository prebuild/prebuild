var nodeGyp = require('node-gyp')()
var util = require('./util')

function runGyp (opts, version, cb) {
  var gyp = opts.gyp || nodeGyp
  if (!opts.rc.preinstall) return run()

  util.spawn(opts.rc.preinstall, function (err) {
    if (err) return cb(err)
    run()
  })

  function run () {
    var args = ['node', 'index.js', 'rebuild', '--target=' + version, '--target_arch=' + opts.rc.arch]
    if (opts.rc.debug) args.push('--debug')
    gyp.parseArgv(args)
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

module.exports = runGyp
