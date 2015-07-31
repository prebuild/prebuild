var path = require('path')
var fs = require('fs')
var request = require('request')
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

    var req = request.get(downloadUrl)
    var status = 0

    log.http('request', 'GET ' + downloadUrl)
    req.on('response', function (res) {
      status = res.statusCode
      log.http(res.statusCode, downloadUrl)
    })

    fs.mkdir(util.prebuildCache(), function () {
      pump(req, fs.createWriteStream(tempFile), function (err) {
        if (err || status !== 200) {
          return fs.unlink(tempFile, function () {
            cb(err || new Error('Failed to download prebuild'))
          })
        }

        fs.rename(tempFile, cachedPrebuild, function (err) {
          if (err) return cb(err)
          unpack()
        })
      })
    })
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
          var resolved = path.resolve(rc.path, binaryName)
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
