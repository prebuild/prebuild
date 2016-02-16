var gyp = require('./gyp')
var util = require('./util')

function runGyp (opts, version, cb) {
  var log = opts.log
  if (!opts.preinstall) return run()

  log.verbose('executing preinstall')
  util.spawn(opts.preinstall, function (err) {
    if (err) return cb(err)
    run()
  })

  function run () {
    var args = ['node', 'index.js']
    if (opts.backend === 'node-ninja') {
      args.push('configure')
      args.push('build')
      args.push('--builddir=build/' + version)
    } else {
      args.push('rebuild')
    }
    args.push('--target=' + version)
    args.push('--target_arch=' + opts.arch)
    if (opts.debug) args.push('--debug')

    gyp({
      gyp: opts.gyp,
      backend: opts.backend,
      log: opts.log,
      args: args,
      version: version,
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
