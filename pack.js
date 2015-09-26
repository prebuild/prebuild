var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var tar = require('tar-stream')
var zlib = require('zlib')

function mode (octal) {
  return parseInt(octal, 8)
}

function pack (filename, tarPath, cb) {
  mkdirp(path.dirname(tarPath), function () {
    fs.stat(filename, function (err, st) {
      if (err) return cb(err)

      var tarStream = tar.pack()
      var ws = fs.createWriteStream(tarPath)
      var stream = tarStream.entry({
        name: filename.replace(/\\/g, '/').replace(/:/g, '_'),
        size: st.size,
        mode: st.mode | mode('444') | mode('222'),
        gid: st.gid,
        uid: st.uid
      })

      fs.createReadStream(filename).pipe(stream).on('finish', function () {
        tarStream.finalize()
      })

      tarStream.pipe(zlib.createGzip()).pipe(ws).on('close', cb)
    })
  })
}

module.exports = pack
