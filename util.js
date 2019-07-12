var path = require('path')
var cp = require('child_process')
var execSpawn = require('execspawn')
var error = require('./error')

function getTarPath (opts, abi) {
  return path.join('prebuilds', [
    opts.pkg.name,
    '-v', opts.pkg.version,
    '-', opts.runtime || 'node',
    '-v', abi,
    '-', opts.platform,
    opts.libc,
    '-', opts.arch,
    '.tar.gz'
  ].join(''))
}

function spawn (cmd, args, cb) {
  return cp.spawn(cmd, args).on('exit', function (code) {
    if (code === 0) return cb()
    cb(error.spawnFailed(cmd, args, code))
  })
}

function fork (file, cb) {
  return cp.fork(file).on('exit', function (code) {
    if (code === 0) return cb()
    cb(error.spawnFailed(file, code))
  })
}

function exec (cmd, cb) {
  return execSpawn(cmd, { stdio: 'inherit' }).on('exit', function (code) {
    if (code === 0) return cb()
    cb(error.spawnFailed(cmd, [], code))
  })
}

function run (item, cb) {
  if (path.extname(item) === '.js') {
    return fork(item, cb)
  } else {
    return exec(item, cb)
  }
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

exports.getTarPath = getTarPath
exports.spawn = spawn
exports.fork = fork
exports.exec = exec
exports.run = run
exports.platform = platform
exports.releaseFolder = releaseFolder
