var nodeGyp = require('node-gyp')()

function runGypInstall (opts, version, cb) {
  var gyp = opts.gyp || nodeGyp
  var log = opts.log

  log.verbose('preparing nodegyp install');
  var args = ['node', 'index.js', 'install', version]
  gyp.parseArgv(args)

  function runStep () {
    var command = gyp.todo.shift()
    if (!command) {
      return cb()
    }

    log.verbose('performing nodegyp install cmd', command.name, command.args)
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
  runStep()
}

module.exports = runGypInstall
