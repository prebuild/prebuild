var path = require('path')
var fs = require('fs')
var get = require('simple-get')
var pump = require('pump')
var tfs = require('tar-fs')
var zlib = require('zlib')
var util = require('./util')

function downloadPrebuild (opts, cb) {
  var downloadUrl = util.getDownloadUrl(opts)
  var cachedPrebuild = util.cachedPrebuild(downloadUrl)
  var tempFile = util.tempFile(cachedPrebuild)

  var pkg = opts.pkg
  var rc = opts.rc
  var log = opts.log

  fs.exists(cachedPrebuild, function (exists) {
    if (exists) return unpack()

    log.http('request', 'GET ' + downloadUrl)
    var req = get(downloadUrl, function (err, res) {
      if (err) return onerror(err)
      log.http(res.statusCode, downloadUrl)
      fs.mkdir(util.prebuildCache(), function () {
        pump(res, fs.createWriteStream(tempFile), function (err) {
          if (err || res.statusCode !== 200) return onerror(err)
          fs.rename(tempFile, cachedPrebuild, function (err) {
            if (err) return cb(err)
            unpack()
          })
        })
      })
    })

    req.setTimeout(30 * 1000, function () {
      req.abort()
    })

    function onerror (err) {
      fs.unlink(tempFile, function () {
        cb(err || new Error('Failed to download prebuild'))
      })
    }
  })

  function unpack () {
    var binaryName

    var updateName = opts.updateName || function (entry) {
      if (/\.node$/i.test(entry.name)) binaryName = entry.name
    }

    pump(fs.createReadStream(cachedPrebuild), zlib.createGunzip(), tfs.extract(rc.path, {readable: true, writable: true}).on('entry', updateName), function (err) {
      if (err) return cb(err)
      if (binaryName) {
        try {
          var resolved = path.resolve(rc.path || '.', binaryName)
          require(resolved)
          log.info('unpack', 'required ' + resolved + ' successfully')
        } catch (err) {
          return cb(err)
        }
        return cb()
      }
      cb(new Error('Missing .node file in archive'))
    })
  }
}

module.exports = downloadPrebuild
