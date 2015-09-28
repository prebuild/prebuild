var nodeGyp = require('node-gyp')()

function runGyp (opts, cb) {
  var gyp = opts.gyp || nodeGyp
  var log = opts.log

  log.verbose('execute node-gyp with `' + opts.args.join(' ') + '`')
  gyp.parseArgv(opts.args)

  function runStep () {
    var command = gyp.todo.shift()
    if (!command) {
      return cb()
    }

    if (opts.filter) {
      if (opts.filter(command)) {
        process.nextTick(runStep)
        return
      }
    }

    gyp.commands[command.name](command.args, function (err) {
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

  if (gyp.todo.length > 0) {
    runStep()
  } else {
    log.verbose('no gyp tasks needed')
    cb()
  }
}

module.exports = runGyp
