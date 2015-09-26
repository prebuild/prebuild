var test = require('tape')
var fs = require('fs')
var rmrf = require('rimraf')
var path = require('path')
var pack = require('../pack')
var zlib = require('zlib')
var tar = require('tar-stream')

var output = path.join(__dirname, 'prebuilds')

test('missing file calls back with error', function (t) {
  pack('thisfilesurelydoesnotexists', 'foo', function (err) {
    t.ok(err, 'should error')
    t.end()
  })
})

test('resulting file is a gzipped tar archive', function (t) {
  t.plan(17)
  rmrf.sync(output)

  t.equal(fs.existsSync(output), false, 'no output folder')

  var filename = path.join(__dirname, 'pack-test.js')
  var tarPath = output + '/@scope/modulename-pack-test.tar.gz'

  var _stat = fs.stat
  fs.stat = function (fpath, cb) {
    t.equal(fs.existsSync(output), true, 'created output folder')
    t.equal(fpath, filename, 'correct filename')
    _stat(fpath, cb)
  }

  var resultStream
  var _createWriteStream = fs.createWriteStream
  fs.createWriteStream = function (path) {
    t.equal(path, tarPath, 'correct tar path')
    resultStream = _createWriteStream(path)
    return resultStream
  }

  var _createReadStream = fs.createReadStream
  fs.createReadStream = function (path) {
    t.equal(path, filename, 'correct filename')
    return _createReadStream(path)
  }

  var gzipStream
  var _createGzip = zlib.createGzip
  zlib.createGzip = function () {
    t.pass('should be called')
    gzipStream = _createGzip()
    var _pipe = gzipStream.pipe.bind(gzipStream)
    gzipStream.pipe = function (stream) {
      t.deepEqual(stream, resultStream, 'piping to correct stream')
      return _pipe(stream)
    }
    return gzipStream
  }

  var tarStream
  var _pack = tar.pack
  tar.pack = function () {
    t.pass('should be called')
    tarStream = _pack()

    var _entry = tarStream.entry.bind(tarStream)
    tarStream.entry = function (opts) {
      t.equal(opts.name, filename, 'correct filename')
      t.ok(opts.size, '.size is set')
      t.ok(opts.mode, '.mode is set')
      t.ok(opts.gid, '.gid is set')
      t.ok(opts.uid, '.uid is set')
      return _entry(opts)
    }

    var _pipe = tarStream.pipe.bind(tarStream)
    tarStream.pipe = function (stream) {
      t.deepEqual(stream, gzipStream, 'piping to correct stream')
      return _pipe(stream)
    }

    var _finalize = tarStream.finalize.bind(tarStream)
    tarStream.finalize = function () {
      t.pass('should be called')
      return _finalize()
    }

    return tarStream
  }

  pack(filename, tarPath, function (err) {
    t.error(err, 'no error')
    t.equal(fs.existsSync(tarPath), true, 'file created')
    fs.stat = _stat
    fs.createWriteStream = _createWriteStream
    fs.createReadStream = _createReadStream
    zlib.createGzip = _createGzip
    tar.pack = _pack
  })
})
