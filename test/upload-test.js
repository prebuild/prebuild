const test = require('tape')
const upload = require('../upload')
const pkg = require('a-native-module/package')

test('uploading to GitHub, basic use case', function (t) {
  upload(basicSetup(t), function (err) {
    t.error(err, 'no error')
    t.end()
  })
})

test('uploading to GitHub, tag prefix, prerelease', function (t) {
  upload(basicSetup(t, { tagPrefix: `${pkg.name}@`, prerelease: true }), function (err) {
    t.error(err, 'no error')
    t.end()
  })
})

test('uploading to GitHub, failing to create release works', function (t) {
  const opts = basicSetup(t)
  opts.gh.create = function (auth, user, repo, opts, cb) {
    process.nextTick(cb.bind(null, new Error('failed to create github release')))
  }
  upload(opts, function (err) {
    t.error(err, 'no error')
    t.end()
  })
})

test('uploading to GitHub, upload fails if getByTag fails', function (t) {
  const opts = basicSetup(t)
  const error = new Error('getByTag failed miserably, buu huu')
  opts.gh.getByTag = function (auth, user, repo, tag, cb) {
    process.nextTick(cb.bind(null, error))
  }
  upload(opts, function (err) {
    t.deepEqual(err, error, 'correct error')
    t.end()
  })
})

test('uploading to GitHub, upload fails if uploadAssets fails', function (t) {
  const opts = basicSetup(t)
  const error = new Error('uploadAssets failed miserably, buu huu')
  opts.gh.uploadAssets = function (auth, user, repo, ref, _files, cb) {
    process.nextTick(cb.bind(null, error))
  }
  upload(opts, function (err) {
    t.deepEqual(err, error, 'correct error')
    t.end()
  })
})

test('uploading to GitHub, only uploading not uploaded files', function (t) {
  const opts = basicSetup(t, { assets: [{ name: 'foo.tar.gz' }, { name: 'baz.tar.gz' }] })
  opts.gh.uploadAssets = function (auth, user, repo, ref, filtered, cb) {
    process.nextTick(cb)
  }
  upload(opts, function (err, result) {
    t.deepEqual(result.new, ['bar.tar.gz'], 'files are filtered correctly')
    t.deepEqual(result.old, ['foo.tar.gz', 'baz.tar.gz'], 'files are filtered correctly')
    t.error(err, 'no error')
    t.end()
  })
})

function basicSetup (t, opts) {
  opts = opts || {}
  const assets = opts.assets || []
  const tagPrefix = opts.tagPrefix || 'v'
  const prerelease = opts.prerelease || false
  const files = ['foo.tar.gz', 'bar.tar.gz', 'baz.tar.gz']
  return {
    pkg,
    upload: 't000k3n',
    files,
    'tag-prefix': tagPrefix,
    prerelease,
    gh: {
      create: function (auth, user, repo, opts, cb) {
        t.deepEqual(auth, { user: 'x-oauth', token: 't000k3n' }, 'correct auth')
        t.equal(user, 'ralphtheninja', 'correct user')
        t.equal(repo, 'a-native-module', 'correct repo')
        t.deepEqual(opts, { tag_name: `${tagPrefix}${pkg.version}`, prerelease }, 'correct opts')
        process.nextTick(cb)
      },
      getByTag: function (auth, user, repo, tag, cb) {
        t.deepEqual(auth, { user: 'x-oauth', token: 't000k3n' }, 'correct auth')
        t.equal(user, 'ralphtheninja', 'correct user')
        t.equal(repo, 'a-native-module', 'correct repo')
        t.equal(tag, `${tagPrefix}${pkg.version}`, 'correct tag')
        process.nextTick(function () { cb(null, { assets }) })
      },
      uploadAssets: function (auth, user, repo, ref, _files, cb) {
        t.deepEqual(auth, { user: 'x-oauth', token: 't000k3n' }, 'correct auth')
        t.equal(user, 'ralphtheninja', 'correct user')
        t.equal(repo, 'a-native-module', 'correct repo')
        t.equal(ref, `tags/${tagPrefix}${pkg.version}`, 'correct tag')
        t.deepEqual(files, _files, 'files are correct')
        process.nextTick(cb)
      }
    }
  }
}
