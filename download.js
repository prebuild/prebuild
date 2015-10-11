var path = require('path')
var fs = require('fs')
var get = require('simple-get')
var pump = require('pump')
var tfs = require('tar-fs')
var zlib = require('zlib')
var mkdirp = require('mkdirp')
var util = require('./util')

function downloadPrebuild (opts, cb) {
  var downloadUrl = util.getDownloadUrl(opts)
  var cachedPrebuild = util.cachedPrebuild(downloadUrl)
  var localPrebuild = util.localPrebuild(downloadUrl)
  var tempFile = util.tempFile(cachedPrebuild)

  var rc = opts.rc
  var log = opts.log

  if (opts.nolocal) return download()

  log.info('download', 'Looking for local prebuild @', localPrebuild)
  fs.exists(localPrebuild, function (exists) {
    if (exists) {
      log.info('download', 'Unpacking local prebuild')
      return unpack(localPrebuild)
    }
    log.info('download', 'No local prebuild found. Downloading')
    download()
  })

  function download () {
    ensureNpmCacheDir(function (err) {
      if (err) return onerror(err)

      fs.exists(cachedPrebuild, function (exists) {
        if (exists) return unpack(cachedPrebuild)

        log.http('request', 'GET ' + downloadUrl)
        var req = get(downloadUrl, function (err, res) {
          if (err) return onerror(err)
          log.http(res.statusCode, downloadUrl)
          if (res.statusCode !== 200) return onerror()
          fs.mkdir(util.prebuildCache(), function () {
            pump(res, fs.createWriteStream(tempFile), function (err) {
              if (err) return onerror(err)
              fs.rename(tempFile, cachedPrebuild, function (err) {
                if (err) return cb(err)
                unpack(cachedPrebuild)
              })
            })
          })
        })

        req.setTimeout(30 * 1000, function () {
          req.abort()
        })
      })

      function onerror (err) {
        fs.unlink(tempFile, function () {
          cb(err || new Error('Prebuilt binaries for node version ' + process.version + ' are not available'))
        })
      }
    })
  }

  function unpack (file) {
    var binaryName

    var updateName = opts.updateName || function (entry) {
      if (/\.node$/i.test(entry.name)) binaryName = entry.name
    }

    pump(fs.createReadStream(file), zlib.createGunzip(), tfs.extract(rc.path, {readable: true, writable: true}).on('entry', updateName), function (err) {
      if (err) return cb(err)
      if (binaryName) {
        return cb(null, path.resolve(rc.path || '.', binaryName))
      }
      cb(new Error('Missing .node file in archive'))
    })
  }

  function ensureNpmCacheDir (cb) {
    (opts.mkdirp || mkdirp)(util.npmCache(), cb)
  }
}

module.exports = downloadPrebuild
