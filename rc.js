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

var npmconfigs = ['proxy', 'https-proxy', 'local-address', 'target', 'runtime']
for (var j = 0; j < npmconfigs.length; ++j) {
  var envname = 'npm_config_' + npmconfigs[j].replace('-', '_')
  if (process.env[envname]) {
    process.argv.push('--' + npmconfigs[j])
    process.argv.push(process.env[envname])
  }
}

var rc = module.exports = require('rc')('prebuild', {
  target: process.versions.node,
  runtime: 'node',
  arch: process.arch,
  libc: process.env.LIBC,
  platform: process.platform,
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
    runtime: 'r',
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
  var arr = [].concat(rc.prebuild)
  var prebuilds = []
  for (var k = 0, len = arr.length; k < len; k++) {
    prebuilds.push({
      runtime: rc.runtime,
      target: arr[k]
    })
  }
  delete rc.prebuild
  rc.prebuild = prebuilds
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
