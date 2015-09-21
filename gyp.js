var nodeGyp = require('node-gyp')()
var util = require('./util')

function runGyp (opts, version, cb) {
  var gyp = opts.gyp || nodeGyp
  var log = opts.log
  if (!opts.rc.preinstall) return run()

  log.verbose('executing preinstall');
  util.spawn(opts.rc.preinstall, function (err) {
    if (err) return cb(err)
    run()
  })

  function run () {
    log.verbose('preparing nodegyp rebuild');
    var args = ['node', 'index.js', 'rebuild', '--target=' + version, '--target_arch=' + opts.rc.arch]
    if (opts.rc.debug) args.push('--debug')
    gyp.parseArgv(args)

    function runStep () {
      var command = gyp.todo.shift()
      if (!command) {
        return cb();
      }

      if (command.name === 'configure') configurePreGyp(command, opts)

      log.verbose('performing nodegyp rebuild cmd', command.name, command.args)
      gyp.commands[command.name](command.args, function(err) {
        if (err) {
          log.error(command.name + ' error')
          log.error('stack', err.stack)
          log.error('not ok')
          return cb(err)
        }

        // Log that the command completed properly
        log.verbose('ok')

        // now run the next command in the queue
        process.nextTick(runStep)
      })
    }
    runStep();
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
