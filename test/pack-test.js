const test = require('tape')
const fs = require('fs')
const path = require('path')
const pack = require('../pack')
const zlib = require('zlib')
const tar = require('tar-stream')

const output = path.join(__dirname, 'prebuilds')

test('missing file calls back with error', function (t) {
  pack('thisfilesurelydoesnotexists', 'foo', function (err) {
    t.ok(err, 'should error')
    t.end()
  })
})

test('resulting file is a gzipped tar archive', function (t) {
  t.plan(17)
  fs.rmSync(output, { recursive: true, force: true })

  t.equal(fs.existsSync(output), false, 'no output folder')

  const filename = path.join(__dirname, 'pack-test.js')
  const tarPath = output + '/@scope/modulename-pack-test.tar.gz'

  const _stat = fs.stat
  fs.stat = function (fpath, cb) {
    t.equal(fs.existsSync(output), true, 'created output folder')
    t.equal(fpath, filename, 'correct filename')
    _stat(fpath, cb)
  }

  let resultStream
  const _createWriteStream = fs.createWriteStream
  fs.createWriteStream = function (path) {
    t.equal(path, tarPath, 'correct tar path')
    resultStream = _createWriteStream(path)
    return resultStream
  }

  const _createReadStream = fs.createReadStream
  fs.createReadStream = function (path) {
    t.equal(path, filename, 'correct filename')
    return _createReadStream(path)
  }

  let gzipStream
  const _createGzip = zlib.createGzip
  if (Object.defineProperty) Object.defineProperty(zlib, 'createGzip', { writable: true })
  zlib.createGzip = function () {
    t.pass('should be called')
    gzipStream = _createGzip()
    const _pipe = gzipStream.pipe.bind(gzipStream)
    gzipStream.pipe = function (stream) {
      t.deepEqual(stream, resultStream, 'piping to correct stream')
      return _pipe(stream)
    }
    return gzipStream
  }

  let tarStream
  const _pack = tar.pack
  tar.pack = function () {
    t.pass('should be called')
    tarStream = _pack()

    const _entry = tarStream.entry.bind(tarStream)
    tarStream.entry = function (opts) {
      t.equal(opts.name, filename.replace(/\\/g, '/').replace(/:/g, '_'), 'correct filename')
      t.notEqual(opts.size, undefined, '.size is set')
      t.notEqual(opts.mode, undefined, '.mode is set')
      t.notEqual(opts.gid, undefined, '.gid is set')
      t.notEqual(opts.uid, undefined, '.uid is set')
      return _entry(opts)
    }

    const _pipe = tarStream.pipe.bind(tarStream)
    tarStream.pipe = function (stream) {
      t.deepEqual(stream, gzipStream, 'piping to correct stream')
      return _pipe(stream)
    }

    const _finalize = tarStream.finalize.bind(tarStream)
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
