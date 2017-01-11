exports.noBuild = function (folder) {
  return new Error('Could not find build in ' + folder)
}

exports.noRepository = function () {
  return new Error('package.json is missing a repository field')
}

exports.spawnFailed = function (cmd, args, code) {
  return new Error(cmd + ' ' + args.join(' ') + ' failed with exit code ' + code)
}
