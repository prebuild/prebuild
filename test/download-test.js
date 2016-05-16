var test = require('tape')
var fs = require('fs')
var rm = require('rimraf')
var path = require('path')
var http = require('http')
var https = require('https')
var download = require('../download')
var rc = require('../rc')
var util = require('../util')
var error = require('../error')

var build = path.join(__dirname, 'build')
var unpacked = path.join(build, 'Release/leveldown.node')

test('downloading from GitHub, not cached', function (t) {
  t.plan(14)
  rm.sync(build)
  rm.sync(util.prebuildCache())

  var opts = getOpts()
  var downloadUrl = util.getDownloadUrl(opts)
  var cachedPrebuild = util.cachedPrebuild(downloadUrl)
  var npmCache = util.npmCache()
  var tempFile

  var existsCallNum = 0
  var _access = fs.access ? fs.access.bind(fs) : fs.access
  var _exists = fs.exists.bind(fs)
  if (_access) {
    fs.access = function (path, a, cb) {
      if (existsCallNum++ === 0) {
        t.equal(path, npmCache, 'fs.exists called for npm cache')
        _access(path, cb)
      }
    }
  }
  fs.exists = function (path, cb) {
    if (existsCallNum++ === 0) {
      t.equal(path, npmCache, 'fs.exists called for npm cache')
      _exists(path, cb)
    } else {
      t.equal(path, cachedPrebuild, 'fs.exists called for prebuild')
      _exists(path, function (exists) {
        t.equal(exists, false, 'prebuild should be cached')
        cb(exists)
      })
    }
  }

  var mkdirCount = 0
  var _mkdir = fs.mkdir.bind(fs)
  fs.mkdir = function () {
    var args = [].slice.call(arguments)
    if (mkdirCount++ === 0) {
      t.equal(args[0], util.prebuildCache(), 'fs.mkdir called for prebuildCache')
    }
    _mkdir.apply(fs, arguments)
  }

  var writeStreamCount = 0
  var _createWriteStream = fs.createWriteStream.bind(fs)
  fs.createWriteStream = function (path) {
    if (writeStreamCount++ === 0) {
      tempFile = path
      t.ok(/\.tmp$/i.test(path), 'this is the temporary file')
    } else {
      t.ok(/\.node$/i.test(path), 'this is the unpacked file')
    }
    return _createWriteStream(path)
  }

  var _createReadStream = fs.createReadStream.bind(fs)
  fs.createReadStream = function (path) {
    t.equal(path, cachedPrebuild, 'createReadStream called for cachedPrebuild')
    return _createReadStream(path)
  }

  var _request = https.request
  https.request = function (opts) {
    https.request = _request
    t.equal('https://' + opts.hostname + opts.path, downloadUrl, 'correct url')
    return _request.apply(https, arguments)
  }

  t.equal(fs.existsSync(build), false, 'no build folder')

  download(opts, function (err) {
    t.error(err, 'no error')
    t.equal(fs.existsSync(util.prebuildCache()), true, 'prebuildCache created')
    t.equal(fs.existsSync(cachedPrebuild), true, 'prebuild was cached')
    t.equal(fs.existsSync(unpacked), true, unpacked + ' should exist')
    t.equal(fs.existsSync(tempFile), false, 'temp file should be gone')
    fs.exists = _exists
    fs.access = _access
    fs.mkdir = _mkdir
    fs.createWriteStream = _createWriteStream
    fs.createReadStream = _createReadStream
  })
})

test('cached prebuild', function (t) {
  t.plan(8)
  rm.sync(build)

  var opts = getOpts()
  var downloadUrl = util.getDownloadUrl(opts)
  var cachedPrebuild = util.cachedPrebuild(downloadUrl)
  var npmCache = util.npmCache()

  var existsCallNum = 0
  var _access = fs.access ? fs.access.bind(fs) : fs.access
  var _exists = fs.exists.bind(fs)
  if (_access) {
    fs.access = function (path, a, cb) {
      if (existsCallNum++ === 0) {
        t.equal(path, npmCache, 'fs.exists called for npm cache')
        _access(path, cb)
      }
    }
  }
  fs.exists = function (path, cb) {
    if (existsCallNum++ === 0) {
      t.equal(path, npmCache, 'fs.exists called for npm cache')
      _exists(path, cb)
    } else {
      t.equal(path, cachedPrebuild, 'fs.exists called for prebuild')
      _exists(path, function (exists) {
        t.equal(exists, true, 'prebuild should be cached')
        cb(exists)
      })
    }
  }

  var _createWriteStream = fs.createWriteStream.bind(fs)
  fs.createWriteStream = function (path) {
    t.ok(/\.node$/i.test(path), 'this is the unpacked file')
    return _createWriteStream(path)
  }

  var _createReadStream = fs.createReadStream.bind(fs)
  fs.createReadStream = function (path) {
    t.equal(path, cachedPrebuild, 'createReadStream called for cachedPrebuild')
    return _createReadStream(path)
  }

  t.equal(fs.existsSync(build), false, 'no build folder')

  download(opts, function (err) {
    t.error(err, 'no error')
    t.equal(fs.existsSync(unpacked), true, unpacked + ' should exist')
    fs.createReadStream = _createReadStream
    fs.createWriteStream = _createWriteStream
    fs.exists = _exists
    fs.access = _access
  })
})

test('missing .node file in .tar.gz should fail', function (t) {
  t.plan(2)

  var opts = getOpts()
  opts.updateName = function (entry) {
    t.ok(/\.node$/i.test(entry.name), 'should match but we pretend it does not')
  }
  download(opts, function (err) {
    t.equal(err.message, 'Missing .node file in archive', 'correct error message')
    t.end()
  })
})

test('non existing host should fail with no dangling temp file', function (t) {
  t.plan(3)

  var opts = getOpts()
  opts.pkg.binary = {
    host: 'https://foo.bar.baz'
  }

  var downloadUrl = util.getDownloadUrl(opts)
  var cachedPrebuild = util.cachedPrebuild(downloadUrl)

  var _createWriteStream = fs.createWriteStream.bind(fs)
  fs.createWriteStream = function (path) {
    t.ok(false, 'no temporary file should be written')
    return _createWriteStream(path)
  }

  t.equal(fs.existsSync(cachedPrebuild), false, 'nothing cached')

  download(opts, function (err) {
    t.ok(err, 'should error')
    t.equal(fs.existsSync(cachedPrebuild), false, 'nothing cached')
    fs.createWriteStream = _createWriteStream
  })
})

test('existing host but invalid url should fail', function (t) {
  t.plan(3)

  var opts = getOpts()
  opts.pkg.binary = {
    host: 'http://localhost:8888',
    remote_path: 'prebuilds',
    package_name: 'woohooo-{abi}'
  }

  var downloadUrl = util.getDownloadUrl(opts)
  var cachedPrebuild = util.cachedPrebuild(downloadUrl)

  var server = http.createServer(function (req, res) {
    t.equal(req.url, '/prebuilds/woohooo-' + process.versions.modules, 'correct url')
    res.statusCode = 404
    res.end()
  }).listen(8888, function () {
    download(opts, function (err) {
      t.same(err, error.noPrebuilts(opts))
      t.equal(fs.existsSync(cachedPrebuild), false, 'nothing cached')
      t.end()
      server.unref()
    })
  })
})

test('error during download should fail with no dangling temp file', function (t) {
  t.plan(7)

  var downloadError = new Error('something went wrong during download')

  var opts = getOpts()
  opts.pkg.binary = {
    host: 'http://localhost:8889',
    remote_path: 'prebuilds',
    package_name: 'woohooo-{abi}'
  }

  var downloadUrl = util.getDownloadUrl(opts)
  var cachedPrebuild = util.cachedPrebuild(downloadUrl)
  var tempFile

  var _createWriteStream = fs.createWriteStream.bind(fs)
  fs.createWriteStream = function (path) {
    tempFile = path
    t.ok(/\.tmp$/i.test(path), 'this is the temporary file')
    return _createWriteStream(path)
  }

  var _request = http.request
  http.request = function (opts) {
    http.request = _request
    t.equal('http://' + opts.hostname + ':' + opts.port + opts.path, downloadUrl, 'correct url')
    var wrapped = arguments[1]
    arguments[1] = function (res) {
      t.equal(res.statusCode, 200, 'correct statusCode')
      // simulates error during download
      setTimeout(function () { res.emit('error', downloadError) }, 10)
      wrapped(res)
    }
    return _request.apply(http, arguments)
  }

  var server = http.createServer(function (req, res) {
    t.equal(req.url, '/prebuilds/woohooo-' + process.versions.modules, 'correct url')
    res.statusCode = 200
    res.write('yep') // simulates hanging request
  }).listen(8889, function () {
    download(opts, function (err) {
      t.equal(err.message, downloadError.message, 'correct error')
      t.equal(fs.existsSync(tempFile), false, 'no dangling temp file')
      t.equal(fs.existsSync(cachedPrebuild), false, 'nothing cached')
      t.end()
      fs.createWriteStream = _createWriteStream
      server.unref()
    })
  })
})

test('should fail if abi is system abi with invalid binary', function (t) {
  var opts = getOpts()
  opts.abi = rc.abi
  opts.pkg.binary = {host: 'http://localhost:8890'}

  var server = http.createServer(function (req, res) {
    res.statusCode = 200
    var archive = path.join(__dirname, 'invalid.tar.gz')
    fs.createReadStream(archive).pipe(res)
  }).listen(8890, function () {
    download(opts, function (err) {
      server.unref()
      if (err && typeof err.message === 'string') {
        t.equal(/invalid\.node: invalid ELF header/.test(err.message), true, 'should match ' + err.message)
      } else {
        t.fail('should have caused a require() error')
      }
      t.end()
    })
  })
})

function getOpts () {
  return {
    pkg: require('a-native-module/package'),
    nolocal: true,
    platform: process.platform,
    arch: process.arch,
    path: __dirname,
    target: process.version,
    log: {http: function (type, message) {}, info: function (type, message) {}}
  }
}
