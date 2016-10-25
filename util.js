var fs = require('fs')
var path = require('path')
var github = require('github-from-package')
var home = require('os-homedir')
var cp = require('child_process')
var execSpawn = require('execspawn')
var expandTemplate = require('expand-template')()
var error = require('./error')

function getDownloadUrl (opts) {
  var pkgName = opts.pkg.name.replace(/^@\w+\//, '')
  return expandTemplate(urlTemplate(opts), {
    name: pkgName,
    package_name: pkgName,
    version: opts.pkg.version,
    major: opts.pkg.version.split('.')[0],
    minor: opts.pkg.version.split('.')[1],
    patch: opts.pkg.version.split('.')[2],
    prerelease: opts.pkg.version.split('-')[1],
    build: opts.pkg.version.split('+')[1],
    abi: opts.abi || process.versions.modules,
    node_abi: process.versions.modules,
    platform: opts.platform,
    arch: opts.arch,
    libc: opts.libc || process.env.LIBC || '',
    configuration: (opts.debug ? 'Debug' : 'Release'),
    module_name: opts.pkg.binary && opts.pkg.binary.module_name
  })
}

function urlTemplate (opts) {
  if (typeof opts.download === 'string') {
    return opts.download
  }

  var packageName = '{name}-v{version}-node-v{abi}-{platform}{libc}-{arch}.tar.gz'
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

function npmCache () {
  return process.env.APPDATA ? path.join(process.env.APPDATA, 'npm-cache') : path.join(home(), '.npm')
}

function prebuildCache () {
  return path.join(npmCache(), '_prebuilds')
}

function tempFile (cached) {
  return cached + '.' + process.pid + '-' + Math.random().toString(16).slice(2) + '.tmp'
}

function getTarPath (opts, abi) {
  return path.join('prebuilds', [
    opts.pkg.name,
    '-v', opts.pkg.version,
    '-node-v', abi,
    '-', opts.platform,
    opts.libc,
    '-', opts.arch,
    '.tar.gz'
  ].join(''))
}

function localPrebuild (url) {
  return path.join('prebuilds', path.basename(url))
}

function readGypFile (opts, cb) {
  var version = opts.version
  var file = opts.file
  var dir = '.' + (opts.backend || 'node-gyp')
  fs.exists(path.join(nodeGypPath(dir), 'iojs-' + version), function (isIojs) {
    if (isIojs) version = 'iojs-' + version
    fs.exists(nodeGypPath(dir, version, 'include/node'), function (exists) {
      if (exists) {
        fs.readFile(nodeGypPath(dir, version, 'include/node', file), 'utf-8', cb)
      } else {
        fs.readFile(nodeGypPath(dir, version, 'src', file), 'utf-8', cb)
      }
    })
  })
}

function nodeGypPath () {
  var args = [].slice.call(arguments)
  return path.join(home(), args.join('/'))
}

function spawn (cmd, args, cb) {
  return cp.spawn(cmd, args).on('exit', function (code) {
    if (code === 0) return cb()
    cb(error.spawnFailed(cmd, args, code))
  })
}

function exec (cmd, cb) {
  return execSpawn(cmd, {stdio: 'inherit'}).on('exit', function (code) {
    if (code === 0) return cb()
    cb(error.spawnFailed(cmd, [], code))
  })
}

function platform () {
  return process.platform
}

function releaseFolder (opts, version) {
  var type = (opts.debug ? 'Debug' : 'Release')
  var binary = opts.pkg.binary
  if (opts.backend === 'node-ninja') {
    return (binary && binary.module_path) || 'build/' + version + '/' + type
  } else {
    return (binary && binary.module_path) || 'build/' + type
  }
}

exports.getDownloadUrl = getDownloadUrl
exports.urlTemplate = urlTemplate
exports.cachedPrebuild = cachedPrebuild
exports.localPrebuild = localPrebuild
exports.prebuildCache = prebuildCache
exports.npmCache = npmCache
exports.tempFile = tempFile
exports.getTarPath = getTarPath
exports.readGypFile = readGypFile
exports.spawn = spawn
exports.exec = exec
exports.platform = platform
exports.releaseFolder = releaseFolder
exports.nodeGypPath = nodeGypPath
