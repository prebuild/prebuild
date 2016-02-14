var path = require('path')
var github = require('github-from-package')
var ghreleases = require('ghreleases')
var error = require('./error')

function upload (opts, cb) {
  var pkg = opts.pkg
  var files = opts.files
  var gh = opts.gh || ghreleases

  var url = github(pkg)
  if (!url) {
    return process.nextTick(function () {
      cb(error.noRepository())
    })
  }

  var user = url.split('/')[3]
  var repo = url.split('/')[4]
  var auth = {user: 'x-oauth', token: opts.upload}
  var tag = 'v' + pkg.version

  gh.create(auth, user, repo, {tag_name: tag}, function () {
    gh.getByTag(auth, user, repo, tag, function (err, release) {
      if (err) return cb(err)

      var assets = release.assets.map(function (asset) {
        return asset.name
      })

      var filtered = files.filter(function (file) {
        return !assets.some(function (asset) {
          return asset === path.basename(file)
        })
      })

      gh.uploadAssets(auth, user, repo, 'tags/' + tag, filtered, function (err) {
        if (err) return cb(err)
        cb(null, {new: filtered, old: assets})
      })
    })
  })
}

module.exports = upload
