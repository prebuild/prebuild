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
  var localPrebuild = util.localPrebuild(downloadUrl)
  var tempFile = util.tempFile(cachedPrebuild)

  var rc = opts.rc
  var log = opts.log

  if (opts.nolocal) return download()

  log.info('looking for local prebuild @', localPrebuild)
  fs.exists(localPrebuild, function (exists) {
    if (exists) {
      log.info('found. unpacking...')
      cachedPrebuild = localPrebuild
      return unpack()
    }

    log.info('not found. downloading...')
    download()
  })

  function download () {
    ensureNpmCacheDir(function (err) {
      if (err) return onerror(err)

      fs.exists(cachedPrebuild, function (exists) {
        if (exists) return unpack()

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
                unpack()
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

  function ensureNpmCacheDir (cb) {
    var cacheFolder = util.npmCache()
    if (fs.access) {
      fs.access(cacheFolder, fs.R_OK | fs.W_OK, function (err) {
        if (err && err.code === 'ENOENT') {
          return makeNpmCacheDir()
        }
        if (err) return cb(err)
        cb()
      })
    } else {
      fs.exists(cacheFolder, function (exists) {
        if (!exists) return makeNpmCacheDir()
        cb()
      })
    }

    function makeNpmCacheDir () {
      log.info('npm cache directory missing, creating it...')
      fs.mkdir(cacheFolder, function (err) {
        if (err) return cb(err)
        cb()
      })
    }
  }
}

module.exports = downloadPrebuild
