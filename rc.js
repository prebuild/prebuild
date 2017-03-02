var minimist = require('minimist')
var targets = require('node-abi').supportedTargets

var rc = require('rc')('prebuild', {
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
  backend: 'node-gyp'
}, minimist(process.argv, {
  alias: {
    target: 't',
    runtime: 'r',
    help: 'h',
    arch: 'a',
    path: 'p',
    force: 'f',
    version: 'v',
    upload: 'u',
    preinstall: 'i'
  },
  string: [
    'target'
  ]
}))

if (rc.path === true) {
  delete rc.path
}

if (rc.target) {
  var arr = [].concat(rc.target)
  rc.prebuild = []
  for (var k = 0, len = arr.length; k < len; k++) {
    rc.prebuild.push({
      runtime: rc.runtime,
      target: arr[k]
    })
  }
}

if (rc.all === true) {
  delete rc.prebuild
  rc.prebuild = targets
}

if (rc['upload-all']) {
  rc.upload = rc['upload-all']
}

module.exports = rc

if (!module.parent) {
  console.log(JSON.stringify(module.exports, null, 2))
}
