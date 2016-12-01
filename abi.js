var ver = require('semver')
var gypinstall = require('./gypinstall')
var util = require('./util')
var error = require('./error')

function getAbiFromTarget (target) {
  if (!target) return process.versions.modules
  if (!ver.valid(target)) {
    throw error.noAbi(target)
  }
  if (ver.eq(target, process.versions.node)) return process.versions.modules
  if (ver.satisfies(target, '^7.0.0')) return '51'
  if (ver.satisfies(target, '^6.0.0')) return '48'
  if (ver.satisfies(target, '^5.0.0')) return '47'
  if (ver.satisfies(target, '^4.0.0')) return '46'
  if (ver.satisfies(target, '^0.12.0')) return '14'
  if (ver.satisfies(target, '^0.10.0')) return '11'

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
