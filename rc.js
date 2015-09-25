var minimist = require('minimist')

if (process.env.npm_config_argv) {
  var npmargs = [
    'compile',
    'no-build-from-source',
    'debug',
  ];
  try {
    var npm_argv = JSON.parse(process.env.npm_config_argv).cooked;
    for (var i = 0; i < npmargs.length; ++i) {
      if (npm_argv.indexOf('--' + npmargs[i]) !== -1) {
        process.argv.push('--' + npmargs[i])
      }
      if (npm_argv.indexOf('--no-' + npmargs[i]) !== -1) {
        process.argv.push('--no-' + npmargs[i])
      }
    }
  } catch(e) { }
}

module.exports = require('rc')('prebuild', {
  target: process.version,
  arch: process.arch,
  platform: process.platform,
  force: false,
  debug: false,
  path: '.'
}, minimist(process.argv, {
  alias: {
    target: 't',
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

if (!module.parent) {
  console.log('%j', module.exports)
}
