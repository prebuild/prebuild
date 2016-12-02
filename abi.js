var gypinstall = require('./gypinstall')
var util = require('./util')
var error = require('./error')

function getAbiFromTarget (target, runtime) {
  if (runtime === 'electron') {
    if (/^1\.4\./.test(target)) return '50'
    if (/^1\.3\./.test(target)) return '49'
    if (/^1\.[1-2]\./.test(target)) return '48'
    if (/^1\.0\./.test(target)) return '47'
    if (/^0\.3[6-7]\./.test(target)) return '47'
    if (/^0\.3[3-5]\./.test(target)) return '46'
    if (/^0\.3[1-2]\./.test(target)) return '45'
    if (/^0\.30\./.test(target)) return '44'
  } else {
    if (!target) return process.versions.modules
    if (target === process.versions.node) return process.versions.modules
    if (/^7\./.test(target)) return '51'
    if (/^6\./.test(target)) return '48'
    if (/^5\./.test(target)) return '47'
    if (/^4\./.test(target)) return '46'
    if (/^0\.12\./.test(target)) return '14'
    if (/^0\.10\./.test(target)) return '11'
  }

  throw error.noAbi(target)
}

function getAbi (opts, version, cb) {
  var log = opts.log
  var install = opts.install || gypinstall
  version = version.replace('v', '')

  tryReadFiles(function (err, abi) {
    if (err && err.code === 'ENOENT') {
      return install({
        log: log,
        force: true,
        backend: opts.backend
      }, version, function (err) {
        if (err) return cb(err)
        tryReadFiles(function (err, abi) {
          if (!err || err.code !== 'ENOENT') return cb(err, abi)
          cb(error.missingHeaders())
        })
      })
    }
    cb(err, abi)
  })

  function tryReadFiles (readCb) {
    util.readGypFile({
      backend: opts.backend,
      version: version,
      file: 'node_version.h'
    }, function (err, a) {
      if (err) return readCb(err)
      util.readGypFile({
        backend: opts.backend,
        version: version,
        file: 'node.h'
      }, function (err, b) {
        if (err) return readCb(err)
        var abi = parse(a) || parse(b)
        if (!abi) return readCb(error.noAbi(version))
        readCb(null, abi)
      })
    })
  }

  function parse (file) {
    var res = file.match(/#define\s+NODE_MODULE_VERSION\s+\(?(\d+)/)
    return (res && res[1])
  }
}

exports.getAbi = getAbi
exports.getAbiFromTarget = getAbiFromTarget
