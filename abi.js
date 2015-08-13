var install = require('node-gyp-install')
var readGypFile = require('./util').readGypFile

function getAbi (opts, version, cb) {
  var log = opts.log
  version = version.replace('v', '')
  readGypFile(version, 'src/node_version.h', function (err, a) {
    if (err && err.code === 'ENOENT') return retry()
    if (err) return cb(err)
    readGypFile(version, 'src/node.h', function (err, b) {
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
