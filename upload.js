const path = require('path')
const github = require('github-from-package')
const ghreleases = require('ghreleases')
const error = require('./error')

function upload (opts, cb) {
  const pkg = opts.pkg
  const files = opts.files
  const gh = opts.gh || ghreleases
  const tagPrefix = opts['tag-prefix']

  const url = github(pkg)
  if (!url) {
    return process.nextTick(function () {
      cb(error.noRepository())
    })
  }

  const user = url.split('/')[3]
  const repo = url.split('/')[4]
  const auth = { user: 'x-oauth', token: opts.upload }
  const tag = `${tagPrefix}${pkg.version}`
  const prerelease = opts.prerelease

  gh.create(auth, user, repo, { tag_name: tag, prerelease }, function () {
    gh.getByTag(auth, user, repo, tag, function (err, release) {
      if (err) return cb(err)

      const assets = release.assets.map(function (asset) {
        return asset.name
      })

      const filtered = files.filter(function (file) {
        return !assets.some(function (asset) {
          return asset === path.basename(file)
        })
      })

      gh.uploadAssets(auth, user, repo, 'tags/' + tag, filtered, function (err) {
        if (err) return cb(err)
        cb(null, { new: filtered, old: assets })
      })
    })
  })
}

module.exports = upload
