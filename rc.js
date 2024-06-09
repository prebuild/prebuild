const minimist = require('minimist')
const targets = require('node-abi').supportedTargets
const detectLibc = require('detect-libc')
const napi = require('napi-build-utils')

const libc = process.env.LIBC || (detectLibc.isNonGlibcLinuxSync() && detectLibc.familySync()) || ''

const rc = require('rc')('prebuild', {
  target: process.versions.node,
  runtime: 'node',
  arch: process.arch,
  libc,
  platform: process.platform,
  all: false,
  force: false,
  debug: false,
  verbose: false,
  path: '.',
  backend: 'node-gyp',
  format: false,
  'include-regex': '\\.node$',
  'tag-prefix': 'v',
  prerelease: false
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
    preinstall: 'i',
    prepack: 'c'
  },
  string: [
    'target'
  ]
}))

if (rc.path === true) {
  delete rc.path
}

if (napi.isNapiRuntime(rc.runtime) && rc.target === process.versions.node) {
  if (rc.all === true) {
    rc.target = napi.getNapiBuildVersions()
  } else {
    rc.target = napi.getBestNapiBuildVersion()
  }
}

if (rc.target) {
  const arr = [].concat(rc.target)
  rc.prebuild = []
  for (let k = 0, len = arr.length; k < len; k++) {
    if (!napi.isNapiRuntime(rc.runtime) || napi.isSupportedVersion(arr[k])) {
      rc.prebuild.push({
        runtime: rc.runtime,
        target: arr[k]
      })
    }
  }
}

if (rc.all === true && !napi.isNapiRuntime(rc.runtime)) {
  delete rc.prebuild
  rc.prebuild = targets
}

if (rc['upload-all']) {
  rc.upload = rc['upload-all']
}

rc['include-regex'] = new RegExp(rc['include-regex'], 'i')

module.exports = rc

if (!module.parent) {
  console.log(JSON.stringify(module.exports, null, 2))
}
