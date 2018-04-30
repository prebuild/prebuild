var util = require('./util')
var spawn = require('child_process').spawn
var which = require('npm-which')(process.cwd())

function runCmake (opts, target, cb) {
  var log = opts.log

  which('cmake-js', function (err, cmakeJsPath) {
    if (err) return cb(err)

    if (!opts.preinstall) return run(cmakeJsPath)

    log.verbose('executing preinstall')
    util.exec(opts.preinstall, function (err) {
      if (err) return cb(err)
      run(cmakeJsPath)
    })
  })

  function run (cmakeJsPath) {
    var args = ['rebuild']
    args.push('--runtime-version=' + target)
    args.push('--target_arch=' + opts.arch)
    args.push('--runtime=' + opts.runtime)

    if (opts.debug) args.push('--debug')

    for (var key of Object.keys(opts)) {
      if (key.substr(0, 2) === 'BK') {
        args.push('--' + key.substr(2) + '=' + opts[key])
      }
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

module.exports = runCmake
