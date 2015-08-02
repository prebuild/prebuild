var path = require('path')
var ghreleases = require('ghreleases')

function upload (opts, cb) {
  var pkg = opts.pkg
  var rc = opts.rc
  var url = opts.url
  var files = opts.files

  var user = url.split('/')[3]
  var repo = url.split('/')[4]
  var auth = {user: 'x-oauth', token: rc.upload}
  var tag = 'v' + pkg.version

  ghreleases.create(auth, user, repo, {tag_name: tag}, function () {
    ghreleases.getByTag(auth, user, repo, tag, function (err, release) {
      if (err) return cb(err)

      files = files.filter(function (file) {
        return !release.assets.some(function (asset) {
          return asset.name === path.basename(file)
        })
      })

      ghreleases.uploadAssets(auth, user, repo, 'tags/' + tag, files, cb)
    })
  })

}

module.exports = upload
