var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var tar = require('tar-stream')
var zlib = require('zlib')
var async = require('async')

function mode (octal) {
  return parseInt(octal, 8)
}

function pack (filenames, tarPath, cb) {
  mkdirp(path.dirname(tarPath), function () {
    var tarStream = tar.pack()
    var ws = fs.createWriteStream(tarPath)

    var tasks = filenames.map(function (filename) {
      return function (done) {
        fs.stat(filename, function (err, st) {
          if (err) {
            // done(err) to stop the waterfall ???
            fs.unlink(tarPath, function () {
              cb(err)
            })
            return
          }

          var stream = tarStream.entry({
            name: filename.replace(/\\/g, '/').replace(/:/g, '_'),
            size: st.size,
            mode: st.mode | mode('444') | mode('222'),
            gid: st.gid,
            uid: st.uid
          })

          fs.createReadStream(filename).pipe(stream).on('finish', function () {
            // call async.waterfall cb
            done()
          })
        })
      }
    })

    async.waterfall(tasks, function () {
      tarStream.finalize()  // finalize archive
      tarStream.pipe(zlib.createGzip()).pipe(ws).on('close', cb)  // compress
    })
  })
}

module.exports = pack
