var gyp = require('./gyp')

function runGypInstall (opts, version, cb) {
  var args = ['node', 'index.js', 'install', version]
  if (opts.distUrl) args.push('--dist-url=' + opts.distUrl)
  gyp({
    gyp: opts.gyp,
    log: opts.log,
    args: args
  }, cb)
}

module.exports = runGypInstall
