var minimist = require('minimist')
var targets = require('./targets')

if (process.env.npm_config_argv) {
  var npmargs = ['compile', 'build-from-source', 'debug']
  try {
    var npmArgv = JSON.parse(process.env.npm_config_argv).cooked
    for (var i = 0; i < npmargs.length; ++i) {
      if (npmArgv.indexOf('--' + npmargs[i]) !== -1) {
        process.argv.push('--' + npmargs[i])
      }
      if (npmArgv.indexOf('--no-' + npmargs[i]) !== -1) {
        process.argv.push('--no-' + npmargs[i])
      }
    }
  } catch (e) { }
}

var npmconfigs = ['proxy', 'https-proxy', 'local-address', 'target', 'abi']
for (var j = 0; j < npmconfigs.length; ++j) {
  var envname = 'npm_config_' + npmconfigs[j].replace('-', '_')
  if (process.env[envname]) {
    process.argv.push('--' + npmconfigs[j])
    process.argv.push(process.env[envname])
  }
}

var rc = module.exports = require('rc')('prebuild', {
  target: process.version,
  arch: process.arch,
  libc: process.env.LIBC,
  platform: process.platform,
  abi: process.versions.modules,
  all: false,
  force: false,
  debug: false,
  verbose: false,
  path: '.',
  backend: 'node-gyp',
  proxy: process.env['HTTP_PROXY'],
  'https-proxy': process.env['HTTPS_PROXY']
}, minimist(process.argv, {
  alias: {
    target: 't',
    prebuild: 'b',
    help: 'h',
    arch: 'a',
    path: 'p',
    force: 'f',
    version: 'v',
    upload: 'u',
    download: 'd',
    'build-from-source': 'compile',
    compile: 'c',
    preinstall: 'i'
  }
}))

if (rc.path === true) {
  delete rc.path
}

if (rc.prebuild) {
  rc.pb = rc.prebuild
}

if (rc.pb) {
  rc.prebuild = rc.pb
}

if (rc.all === true) {
  delete rc.prebuild
  rc.prebuild = targets
}

if (rc['upload-all']) {
  rc.upload = rc['upload-all']
}

if (!module.parent) {
  console.log(JSON.stringify(module.exports, null, 2))
}
