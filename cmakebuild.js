var util = require('./util')
var path = require('path')
var spawn = require('child_process').spawn

function runGyp (opts, target, cb) {
  var log = opts.log
  if (!opts.preinstall) return run()

  log.verbose('executing preinstall')
  util.exec(opts.preinstall, function (err) {
    if (err) return cb(err)
    run()
  })

  function run () {
    var cmakeJsPath = path.join(
      __dirname,
      '../',
      '.bin',
      process.platform === 'win32' ? 'cmake-js.cmd' : 'cmake-js'
    )

    var args = ['rebuild']
    args.push('--runtime-version=' + target)
    args.push('--target_arch=' + opts.arch)
    args.push('--runtime=' + opts.runtime)

    if (opts.debug) args.push('--debug')

    if (opts.toolset) args.push('--toolset=' + opts.toolset)

    if (target.split('.')[0] > 4) {
      process.env.msvs_toolset = 14
      process.env.msvs_version = 2015
    } else {
      process.env.msvs_toolset = 12
      process.env.msvs_version = 2013
    }

    var proc = spawn(cmakeJsPath, args, {
      env: process.env
    })
    proc.stdout.pipe(process.stdout)
    proc.stderr.pipe(process.stderr)
    proc.on('exit', function (code, sig) {
      if (code === 1) {
        return cb(new Error('Failed to build...'))
      }
      cb()
    })
  }
}

module.exports = runGyp
