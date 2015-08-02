#!/usr/bin/env node

var path = require('path')
var log = require('npmlog')
var fs = require('fs')
var github = require('github-from-package')
var after = require('after')

var rc = require('./rc')
var download = require('./download')
var prebuild = require('./prebuild')
var build = require('./build')
var upload = require('./upload')

if (rc.path) process.chdir(rc.path)

if (rc.version) {
  console.log(require('./package.json').version)
  process.exit(0)
}

log.heading = 'prebuild'
if (process.env.npm_config_loglevel && !rc.verbose) log.level = process.env.npm_config_loglevel

if (!fs.existsSync('package.json')) {
  log.error('setup', 'No package.json found. Aborting...')
  process.exit(1)
}

var pkg = require(path.resolve('package.json'))

if (rc.help) {
  console.error(fs.readFileSync(path.join(__dirname, 'help.txt'), 'utf-8'))
  process.exit(0)
}

if (rc.compile) return build(process.version, onbuilderror)
if (rc.download) {
  return download({pkg: pkg, rc: rc, log: log}, function (err) {
    if (err) {
      log.warn('install', err.message)
      log.info('install', 'Falling back to compilation')
      return build(process.version, onbuilderror)
    }
    log.info('install', 'Prebuild successfully installed!')
  })
}

var targets = [].concat(rc.target)
var buildLog = log.info.bind(log, 'build')
var files = []

var done = after(targets.length, function (err) {
  if (err) return onbuilderror(err)
  if (!rc.upload) return
  var url = github(pkg)
  if (!url) return onbuilderror(new Error('package.json is missing a repository field'))
  buildLog('Uploading prebuilds to Github releases')
  upload({pkg: pkg, rc: rc, url: url, files: files}, function (err) {
    if (err) return onbuilderror(err)
    buildLog('Uploaded ' + files.length + ' new prebuild(s) to Github')
  })
})

var opts = {pkg: pkg, rc: rc, log: log, buildLog: buildLog}
targets.forEach(function (target) {
  prebuild(opts, target, function (err, tarGz) {
    if (err) return done(err)
    files.push(tarGz)
    done()
  })
})

function onbuilderror (err) {
  if (!err) return
  log.error('build', err.message)
  process.exit(2)
}
