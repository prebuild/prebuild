var path = require('path')
var github = require('github-from-package')
var home = require('home-dir')

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

function expandTemplate (template, values) {
  Object.keys(values).forEach(function (key) {
    var regexp = new RegExp('\{' + key + '\}', 'g')
    template = template.replace(regexp, values[key])
  })
  return template
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

exports.getDownloadUrl = getDownloadUrl
exports.expandTemplate = expandTemplate
exports.urlTemplate = urlTemplate
exports.cachedPrebuild = cachedPrebuild
exports.prebuildCache = prebuildCache
exports.tempFile = tempFile
