var spawn = require('child_process').spawn
var which = require('npm-which')(process.cwd())

function runCmake (opts, target, cb) {
  which('cmake-js', function (err, cmakeJsPath) {
    if (err) return cb(err)

    var args = ['rebuild']
    args.push('--runtime-version=' + target)
    args.push('--target_arch=' + opts.arch)
    args.push('--runtime=' + opts.runtime)

    if (opts.debug) args.push('--debug')

    if (opts.format) args = args.concat(opts.format.split(' '))

    var proc = spawn(cmakeJsPath, args)
    proc.stdout.pipe(process.stdout)
    proc.stderr.pipe(process.stderr)
    proc.on('exit', function (code, sig) {
      if (code === 1) {
        return cb(new Error('Failed to build...'))
      }
      cb()
    })
  })
}

module.exports = runCmake
