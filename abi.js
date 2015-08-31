var nodeGypInstall = require('node-gyp-install')
var util = require('./util')

function getAbi (opts, version, cb) {
  var log = opts.log
  var install = opts.install || nodeGypInstall
  version = version.replace('v', '')

  util.readGypFile(version, 'src/node_version.h', function (err, a) {
    if (err && err.code === 'ENOENT') return retry()
    if (err) return cb(err)
    util.readGypFile(version, 'src/node.h', function (err, b) {
      if (err && err.code === 'ENOENT') return retry()
      if (err) return cb(err)
      var abi = parse(a) || parse(b)
      if (!abi) return cb(new Error('Could not detect abi for ' + version))
      cb(null, abi)
    })
  })

  function retry () {
    install({log: log, version: version, force: true}, function (err) {
      if (err) return cb(err)
      getAbi(version, cb)
    })
  }

  function parse (file) {
    var res = file.match(/#define\s+NODE_MODULE_VERSION\s+\(?(\d+)/)
    return res && res[1]
  }
}

module.exports = getAbi
