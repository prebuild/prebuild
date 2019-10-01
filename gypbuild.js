var napi = require('napi-build-utils')
var gyp = require('./gyp')

function runGyp (opts, target, cb) {
  var args = ['node', 'index.js']
  if (opts.backend === 'node-ninja') {
    args.push('configure')
    args.push('build')
    args.push('--builddir=build/' + target)
  } else {
    args.push('rebuild')
  }
  if (napi.isNapiRuntime(opts.runtime)) {
    args.push('--napi_build_version=' + target)
  } else {
    args.push('--target=' + target)
  }
  args.push('--target_arch=' + opts.arch)
  if (opts.runtime === 'electron') {
    args.push('--runtime=electron')
    args.push('--dist-url=https://atom.io/download/electron')
  } else if (opts.runtime === 'node-webkit') {
    args.push('--runtime=node-webkit')
  } else if (opts.runtime === 'node') {
    // work around bug introduced in node 10's build https://github.com/nodejs/node-gyp/issues/1457
    args.push('--build_v8_with_gn=false')
    // work around the same kind of bug for node 11
    args.push('--enable_lto=false')
  }
  if (opts.debug) args.push('--debug')

  if (opts.format) args.push('--', '--format', opts.format)

  gyp({
    gyp: opts.gyp,
    runtime: opts.runtime,
    backend: opts.backend,
    log: opts.log,
    args: args,
    filter: function (command) {
      if (command.name === 'configure') {
        return configurePreGyp(command, opts)
      }
    }
  }, cb)
}

function configurePreGyp (command, opts) {
  var binary = opts.pkg.binary
  if (binary && binary.module_name) {
    command.args.push('-Dmodule_name=' + binary.module_name)
  }
  if (binary && binary.module_path) {
    command.args.push('-Dmodule_path=' + binary.module_path)
  }
}

module.exports = runGyp
