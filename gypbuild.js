var util = require('./util')

function runGyp (opts, target, cb) {
  var log = opts.log
  if (!opts.preinstall) return run()

  log.verbose('executing preinstall')
  util.exec(opts.preinstall, function (err) {
    if (err) return cb(err)
    run()
  })

  function run () {
    var args = ['node-gyp', 'rebuild']
    args.push('--target=' + target)
    args.push('--target_arch=' + opts.arch)
    if (opts.runtime === 'electron') {
      args.push('--runtime=electron')
      args.push('--dist-url=https://atom.io/download/electron')
    }
    if (opts.debug) args.push('--debug')

    var cmd = args.join(' ')
    log.verbose('build', cmd)
    util.exec(cmd, function (err) {
      if (err) {
        log.error('build', 'rebuild failed')
        log.error('stack', err.stack)
        return cb(err)
      }
      cb()
    })
  }
}

module.exports = runGyp
