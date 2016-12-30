#!/usr/bin/env node

var path = require('path')
var log = require('npmlog')
var fs = require('fs')
var async = require('async')
var extend = require('xtend')

var pkg = require(path.resolve('package.json'))
var rc = require('./rc')
var prebuild = require('./prebuild')
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
}

if (!fs.existsSync('package.json')) {
  log.error('setup', 'No package.json found. Aborting...')
  process.exit(1)
}

if (rc.help) {
  console.error(fs.readFileSync(path.join(__dirname, 'help.txt'), 'utf-8'))
  process.exit(0)
}

log.info('begin', 'Prebuild version', prebuildVersion)

// nvm! do not mess with headers? kkthx!
delete process.env.NVM_IOJS_ORG_MIRROR
delete process.env.NVM_NODEJS_ORG_MIRROR

var buildLog = log.info.bind(log, 'build')
var opts = extend(rc, {pkg: pkg, log: log, buildLog: buildLog})

if (opts['upload-all']) {
  fs.readdir('prebuilds', function (err, pbFiles) {
    if (err) return onbuilderror(err)
    uploadFiles(pbFiles.map(function (file) { return 'prebuilds/' + file }))
  })
} else {
  var files = []
  async.eachSeries(opts.prebuild, function (target, next) {
    prebuild(opts, target.target, target.runtime, function (err, tarGz) {
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
