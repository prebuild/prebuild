var gyp = require('./gyp')
var util = require('./util')

function runGyp (opts, version, cb) {
  var log = opts.log
  if (!opts.rc.preinstall) return run()

  log.verbose('executing preinstall')
  util.spawn(opts.rc.preinstall, function (err) {
    if (err) return cb(err)
    run()
  })

  function run () {
    var args = ['node', 'index.js', 'rebuild', '--target=' + version, '--target_arch=' + opts.rc.arch]
    if (opts.rc.debug) args.push('--debug')

    gyp({
      gyp: opts.gyp,
      log: opts.log,
      args: args,
      filter: function (command) {
        if (command.name === 'configure') {
          return configurePreGyp(command, opts)
        }
      }
    }, cb)
  }
}

function configurePreGyp (command, opts) {
  var binary = opts.pkg.binary
  if (binary && binary.module_name) {
    command.args.push('-Dmodule_name=' + binary.module_name)
  }
  if (binary && binary.module_path) {
    command.args.push('-Dmodule_path=' + binary.module_path)
  }
}

module.exports = runGyp
