var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var tar = require('tar-stream')
var zlib = require('zlib')

function mode(octal) {
  return parseInt(octal, 8)
}

function pack(filenames, tarPath, cb) {
  mkdirp(path.dirname(tarPath), function () {
    var tarStream = tar.pack()
    var ws = fs.createWriteStream(tarPath)

    var tasks = fileNames.map(function (filename) {
      return function (cbWaterfall) {
        fs.stat(filename, function (err, st) {
          if (err) return cb(err)

          var stream = tarStream.entry({
            name: filename.replace(/\\/g, '/').replace(/:/g, '_'),
            size: st.size,
            mode: st.mode | mode('444') | mode('222'),
            gid: st.gid,
            uid: st.uid
          })

          fs.createReadStream(filename).pipe(stream).on('finish', function () {
            //call async.waterfall cb
            cbWaterfall()
          })
        })
      }
    })

    tasks.push(function () {
      tarStream.finalize()  // finalize archive
      tarStream.pipe(zlib.createGzip()).pipe(ws).on('close', cbWaterfall)  // compress
    })

    async.waterfall(tasks, cb)
  })
}

module.exports = pack
