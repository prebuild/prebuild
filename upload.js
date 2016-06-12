var path = require('path')

var ghreleases = require('ghreleases')
var github = require('github-from-package')
var SemVer = require('semver')

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

  var semver = SemVer(pkg.version)

  var user = url.split('/')[3]
  var repo = url.split('/')[4]
  var auth = {user: 'x-oauth', token: opts.upload}
  var tag = 'v' + semver.format()

  var options = {tag_name: tag}

  if(semver.prerelease.length || opts.prerelease) options.prerelease = true

  gh.create(auth, user, repo, options, function () {
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
