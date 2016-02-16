var assert = require('assert')
var backends = {
  'node-gyp': require('node-gyp')(),
  'node-ninja': require('node-ninja')()
}

function runGyp (opts, cb) {
  var backend = opts.backend || 'node-gyp'
  var gyp = opts.gyp || backends[backend]
  assert(gyp, 'missing backend')
  var log = opts.log
  var args = opts.args
  assert(Array.isArray(args), 'args must be an array')

  log.verbose('execute ' + backend + ' with `' + args.join(' ') + '`')
  gyp.parseArgv(args)

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

      log.verbose('ok')
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
