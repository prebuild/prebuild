exports.noPrebuilts = function (opts) {
  return new Error([
    'No prebuilt binaries found',
    '(target=' + opts.target,
    'arch=' + opts.arch,
    'platform=' + opts.platform + ')'
  ].join(' '))
}
