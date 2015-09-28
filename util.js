var fs = require('fs')
var path = require('path')
var github = require('github-from-package')
var home = require('home-dir')
var cp = require('child_process')
var expandTemplate = require('expand-template')()

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
    abi: process.versions.modules,
    node_abi: process.versions.modules,
    platform: opts.rc.platform,
    arch: opts.rc.arch,
    configuration: (opts.rc.debug ? 'Debug' : 'Release'),
    module_name: opts.pkg.binary && opts.pkg.binary.module_name
  })
}

function urlTemplate (opts) {
  if (typeof opts.rc.download === 'string') {
    return opts.rc.download
  }

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
    '-', opts.rc.platform,
    '-', opts.rc.arch,
    '.tar.gz'
  ].join(''))
}

function localPrebuild (url) {
  return path.join('prebuilds', path.basename(url))
}

function readGypFile (version, file, cb) {
  fs.exists(path.join(nodeGypPath(), 'iojs-' + version), function (isIojs) {
    if (isIojs) version = 'iojs-' + version
    fs.exists(nodeGypPath(version, 'include/node'), function (exists) {
      if (exists) {
        fs.readFile(nodeGypPath(version, 'include/node', file), 'utf-8', cb)
      } else {
        fs.readFile(nodeGypPath(version, 'src', file), 'utf-8', cb)
      }
    })
  })
}

function nodeGypPath () {
  var args = [].slice.call(arguments)
  return path.join(home(), '.node-gyp', args.join('/'))
}

function spawn (cmd, args, cb) {
  args = args || []
  if (typeof args === 'function') {
    cb = args
    args = []
  }
  return cp.spawn(cmd, args, {stdio: 'inherit'}).on('exit', function (code) {
    if (code === 0) return cb()
    cb(new Error(cmd + ' ' + args.join(' ') + ' failed with exit code ' + code))
  })
}

function platform () {
  return process.platform
}

function releaseFolder (opts) {
  var type = (opts.rc.debug ? 'Debug' : 'Release')
  var binary = opts.pkg.binary
  return (binary && binary.module_path) || 'build/' + type
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
exports.platform = platform
exports.releaseFolder = releaseFolder
exports.nodeGypPath = nodeGypPath
