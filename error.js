exports.noPrebuilts = function (opts) {
  return new Error([
    'No prebuilt binaries found',
    '(target=' + opts.target,
    'arch=' + opts.arch,
    'platform=' + opts.platform + ')'
  ].join(' '))
}

exports.missingHeaders = function () {
  return new Error('Failed to locate `node.h` and `node_version.h`.')
}

exports.noAbi = function (v) {
  return new Error('Could not detect abi for version ' + v)
}

exports.noBuild = function (folder) {
  return new Error('Could not find build in ' + folder)
}

exports.invalidArchive = function () {
  return new Error('Missing .node file in archive')
}

exports.noRepository = function () {
  return new Error('package.json is missing a repository field')
}

exports.spawnFailed = function (cmd, args, code) {
  return new Error(cmd + ' ' + args.join(' ') + ' failed with exit code ' + code)
}
