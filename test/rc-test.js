var test = require('tape')
var path = require('path')
var rc = require('../rc')
var exec = require('child_process').exec

test('default config', function (t) {
  t.equal(rc.target, process.version, 'correct target')
  t.equal(rc.arch, process.arch, 'correct arch')
  t.equal(rc.platform, process.platform, 'correct platform')
  t.equal(rc.compile, false, 'compile is explicit')
  t.equal(rc.force, false, 'force is explicit')
  t.equal(rc.debug, false, 'debug not set')
  t.equal(rc.path, '.', 'correct path')
  t.equal(rc.help, undefined, 'help not set')
  t.equal(rc.upload, undefined, 'upload not set')
  t.equal(rc.download, undefined, 'download not set')
  t.equal(rc.version, undefined, 'version not set')
  t.equal(rc.preinstall, undefined, 'preinstall not set')
  t.end()
})

test('custom config and aliases', function (t) {
  var args = [
    '--target vX.Y.Z',
    '--target vZ.Y.X',
    '--arch ARCH',
    '--platform PLATFORM',
    '--download https://foo.bar',
    '--upload t00k3n',
    '--compile',
    '--debug',
    '--force',
    '--version',
    '--help',
    '--path ../some/other/path',
    '--preinstall somescript.js'
  ]
  runRc(t, args.join(' '), function (rc) {
    t.deepEqual(rc.target, [ 'vX.Y.Z', 'vZ.Y.X' ], 'correct targets')
    t.deepEqual(rc.target, rc.t)
    t.equal(rc.arch, 'ARCH', 'correct arch')
    t.equal(rc.arch, rc.a)
    t.equal(rc.platform, 'PLATFORM', 'correct platform')
    t.equal(rc.download, 'https://foo.bar', 'download is set')
    t.equal(rc.download, rc.d)
    t.equal(rc.upload, 't00k3n', 'upload token set')
    t.equal(rc.upload, rc.u)
    t.equal(rc.compile, true, 'compile is set')
    t.equal(rc.compile, rc.c)
    t.equal(rc.debug, true, 'debug is set')
    t.equal(rc.force, true, 'force is set')
    t.equal(rc.force, rc.f)
    t.equal(rc.version, true, 'version is set')
    t.equal(rc.version, rc.v)
    t.equal(rc.help, true, 'help is set')
    t.equal(rc.help, rc.h)
    t.equal(rc.path, '../some/other/path', 'correct path')
    t.equal(rc.path, rc.p)
    t.equal(rc.preinstall, 'somescript.js', 'correct script')
    t.equal(rc.preinstall, rc.i)
    t.end()
  })
})

function runRc (t, args, cb) {
  var cmd = 'node ' + path.resolve(__dirname, '..', 'rc.js') + ' ' + args
  exec(cmd, function (err, stdout, stderr) {
    t.error(err, 'no error')
    t.equal(stderr.length, 0, 'no stderr')
    var result
    try {
      result = JSON.parse(stdout.toString())
      t.pass('json parsed correctly')
    }
    catch (e) {
      t.fail(e.message)
    }
    cb(result)
  })
}
