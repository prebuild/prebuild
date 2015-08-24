var fs = require('fs')
var path = require('path')
var github = require('github-from-package')
var home = require('home-dir')
var expandTemplate = require('expand-template')()

function getDownloadUrl (opts) {
  return expandTemplate(urlTemplate(opts), {
    name: opts.pkg.name,
    package_name: opts.pkg.name,
    version: opts.pkg.version,
    major: opts.pkg.version.split('.')[0],
    minor: opts.pkg.version.split('.')[1],
    patch: opts.pkg.version.split('.')[2],
    prerelease: opts.pkg.version.split('-')[1],
    build: opts.pkg.version.split('+')[1],
    abi: process.versions.modules,
    node_abi: process.versions.modules,
    platform: opts.rc.platform,
    arch: opts.rc.arch,
    configuration: (opts.rc.debug ? 'Debug' : 'Release'),
    module_name: opts.pkg.binary && opts.pkg.binary.module_name
  })
}

function urlTemplate (opts) {
  if (typeof opts.rc.download == 'string') return opts.rc.download
  var packageName = '{name}-v{version}-node-v{abi}-{platform}-{arch}.tar.gz'
  if (opts.pkg.binary) {
    return [
      opts.pkg.binary.host,
      opts.pkg.binary.remote_path,
      opts.pkg.binary.package_name || packageName
    ].map(function (path) {
      return trimSlashes(path)
    }).filter(Boolean).join('/')
  }
  return github(opts.pkg) + '/releases/download/v{version}/' + packageName
}

function trimSlashes (str) {
  if (str) return str.replace(/^\.\/|^\/|\/$/g, '')
}

function cachedPrebuild (url) {
  return path.join(prebuildCache(), url.replace(/[^a-zA-Z0-9.]+/g, '-'))
}

function prebuildCache () {
  var npm = process.env.APPDATA ? path.join(process.env.APPDATA, 'npm-cache') : path.join(home(), '.npm')
  return path.join(npm, '_prebuilds')
}

function tempFile (cached) {
  return cached + '.' + process.pid + '-' + Math.random().toString(16).slice(2) + '.tmp'
}

// TODO test
function getTarPath (opts, abi) {
  return path.join('prebuilds', [
    opts.pkg.name,
    '-v', opts.pkg.version,
    '-node-v', abi,
    '-', opts.rc.platform,
    '-', opts.rc.arch,
    '.tar.gz'
  ].join(''))
}

// TODO test
function readGypFile (version, file, cb) {
  fs.readFile(path.join(nodeGypPath(), version, file), 'utf-8', cb)
}

function nodeGypPath () {
  return path.join(home(), '.node-gyp')
}

exports.getDownloadUrl = getDownloadUrl
exports.urlTemplate = urlTemplate
exports.cachedPrebuild = cachedPrebuild
exports.prebuildCache = prebuildCache
exports.tempFile = tempFile
exports.getTarPath = getTarPath
exports.readGypFile = readGypFile
