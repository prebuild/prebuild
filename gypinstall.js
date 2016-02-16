var gyp = require('./gyp')

// TODO test this
function runGypInstall (opts, version, cb) {
  gyp({
    log: opts.log,
    args: ['node', 'index.js', 'install', version]
  }, cb)
}

module.exports = runGypInstall
