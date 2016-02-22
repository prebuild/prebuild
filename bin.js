#!/usr/bin/env node

var path = require('path')
var log = require('npmlog')
var fs = require('fs')
var async = require('async')
var extend = require('xtend')

var rc = require('./rc')
var download = require('./download')
var prebuild = require('./prebuild')
var build = require('./build')
var upload = require('./upload')

var prebuildVersion = require('./package.json').version
if (rc.version) {
  console.log(prebuildVersion)
  process.exit(0)
}

if (rc.path) process.chdir(rc.path)

log.heading = 'prebuild'
if (rc.verbose) {
  log.level = 'verbose'
} else if (process.env.npm_config_loglevel) {
  log.level = process.env.npm_config_loglevel
}

if (!fs.existsSync('package.json')) {
  log.error('setup', 'No package.json found. Aborting...')
  process.exit(1)
}

var pkg = require(path.resolve('package.json'))

if (rc.help) {
  console.error(fs.readFileSync(path.join(__dirname, 'help.txt'), 'utf-8'))
  process.exit(0)
}

log.info('begin', 'Prebuild version', prebuildVersion)

// nvm! do not mess with headers? kkthx!
delete process.env.NVM_IOJS_ORG_MIRROR
delete process.env.NVM_NODEJS_ORG_MIRROR

if (rc.install) {
  if (!(typeof pkg._from === 'string')) {
    // From Git directly
    rc.compile = true
  } else if (pkg._from.length > 4 && pkg._from.substr(0, 4) === 'git+') {
    // From npm install git+
    rc.compile = true
  } else {
    // From npm repository
    rc.download = rc.install
  }
}

var buildLog = log.info.bind(log, 'build')
var opts = extend(rc, {pkg: pkg, log: log, buildLog: buildLog})

if (opts.compile) {
  build(opts, rc.target, onbuilderror)
} else if (opts.download) {
  download(opts, function (err) {
    if (err) {
      log.warn('install', err.message)
      if (opts.compile === false) {
        log.info('install', 'no-compile specified, not attempting build.')
        return
      }
      log.info('install', 'We will now try to compile from source.')
      return build(opts, rc.target, onbuilderror)
    }
    log.info('install', 'Prebuild successfully installed!')
  })
} else if (opts['upload-all']) {
  fs.readdir('prebuilds', function (err, pbFiles) {
    if (err) return onbuilderror(err)
    uploadFiles(pbFiles.map(function (file) { return 'prebuilds/' + file }))
  })
} else {
  var files = []
  async.eachSeries([].concat(opts.prebuild), function (target, next) {
    prebuild(opts, target, function (err, tarGz) {
      if (err) return next(err)
      files.push(tarGz)
      next()
    })
  }, function (err) {
    if (err) return onbuilderror(err)
    if (!opts.upload) return
    uploadFiles(files)
  })
}

function uploadFiles (files) {
  buildLog('Uploading ' + files.length + ' prebuilds(s) to Github releases')
  upload(extend(opts, {files: files}), function (err, result) {
    if (err) return onbuilderror(err)
    buildLog('Found ' + result.old.length + ' prebuild(s) on Github')
    if (result.old.length) {
      result.old.forEach(function (build) {
        buildLog('-> ' + build)
      })
    }
    buildLog('Uploaded ' + result.new.length + ' new prebuild(s) to Github')
    if (result.new.length) {
      result.new.forEach(function (build) {
        buildLog('-> ' + build)
      })
    }
  })
}

function onbuilderror (err) {
  if (!err) return
  log.error('build', err.stack)
  process.exit(2)
}
