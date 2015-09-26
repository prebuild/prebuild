var gypinstall = require('./gypinstall')
var util = require('./util')

function getAbi (opts, version, cb) {
  var log = opts.log
  var install = opts.install || gypinstall
  version = version.replace('v', '')

  tryReadFiles(function (err, abi) {
    if (err && err.code === 'ENOENT') {
      return install({log: log, force: true}, version, function (err) {
        if (err) return cb(err)
        tryReadFiles(function (err, abi) {
          if (!err || err.code !== 'ENOENT') return cb(err, abi)
          cb(new Error('Failed to locate `node.h` and `node_version.h`.'))
        })
      })
    }

    cb(err, abi)
  })

  function tryReadFiles (readCb) {
    util.readGypFile(version, 'node_version.h', function (err, a) {
      if (err) return readCb(err)
      util.readGypFile(version, 'node.h', function (err, b) {
        if (err) return readCb(err)
        var abi = parse(a) || parse(b)
        if (!abi) return readCb(new Error('Could not detect abi for ' + version))
        readCb(null, abi)
      })
    })
  }

  function parse (file) {
    var res = file.match(/#define\s+NODE_MODULE_VERSION\s+\(?(\d+)/)
    return (res && res[1])
  }
}

module.exports = getAbi
