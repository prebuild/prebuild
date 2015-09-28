var gyp = require('./gyp')

function runGypInstall (opts, version, cb) {
  gyp({
    gyp: opts.gyp,
    log: opts.log,
    args: ['node', 'index.js', 'install', version]
  }, cb)
}

module.exports = runGypInstall
