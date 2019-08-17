var eachSeries = require('each-series-async')
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var tar = require('tar-stream')
var zlib = require('zlib')

function mode (octal) {
  return parseInt(octal, 8)
}

function pack (filenames, tarPath, cb) {
  mkdirp(path.dirname(tarPath), function () {
    if (!Array.isArray(filenames)) {
      filenames = [filenames]
    }

    var tarStream = tar.pack()
    var ws = fs.createWriteStream(tarPath)
    tarStream.pipe(zlib.createGzip({ level: 9 })).pipe(ws)

    eachSeries(filenames, function processFile (filename, nextFile) {
      fs.stat(filename, function (err, st) {
        if (err) return nextFile(err)

        var stream = tarStream.entry({
          name: filename.replace(/\\/g, '/').replace(/:/g, '_'),
          size: st.size,
          mode: st.mode | mode('444') | mode('222'),
          gid: st.gid,
          uid: st.uid
        })

        fs.createReadStream(filename).pipe(stream).on('finish', nextFile)

        stream.on('error', nextFile)
      })
    }, function allFilesProcessed (err) {
      tarStream.finalize()
      cb(err)
    })
  })
}

module.exports = pack
