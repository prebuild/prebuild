var util = require('./util')

function strip (file, cb) {
  // TODO no support on windows, noop
  var platform = util.platform()
  if (platform === 'win32') return process.nextTick(cb)
  util.spawn(process.env.STRIP || 'strip', stripArgs(platform, file), cb)
}

function stripArgs (platform, file) {
  if (platform === 'darwin') return [file, '-Sx']
  if (['freebsd', 'linux'].includes(platform)) return [file, '--strip-all']
  // TODO find out what args to use for other platforms, e.g. 'sunos'
  return []
}

module.exports = strip
