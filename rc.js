var minimist = require('minimist')

module.exports = require('rc')('prebuild', {
  target: process.version,
  arch: process.arch,
  platform: process.platform
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
  },
  default: {
    // this is hackish - whats the correct way of doing this?
    compile: !!process.env.prebuild_compile || (process.env.npm_config_argv && process.env.npm_config_argv.indexOf('--build-from-source') > -1)
  }
}))
