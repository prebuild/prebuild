const eachSeries = require('each-series-async')
const fs = require('fs')
const path = require('path')
const tar = require('tar-stream')
const zlib = require('zlib')

function mode (octal) {
  return parseInt(octal, 8)
}

function pack (filenames, tarPath, cb) {
  fs.mkdir(path.dirname(tarPath), { recursive: true }, function () {
    if (!Array.isArray(filenames)) {
      filenames = [filenames]
    }

    const tarStream = tar.pack()
    const ws = fs.createWriteStream(tarPath)
    tarStream.pipe(zlib.createGzip({ level: 9 })).pipe(ws)

    eachSeries(filenames, function processFile (filename, nextFile) {
      fs.stat(filename, function (err, st) {
        if (err) return nextFile(err)

        const stream = tarStream.entry({
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
