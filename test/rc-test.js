var test = require('tape')
var path = require('path')
var exec = require('child_process').exec
var xtend = require('xtend')
var targets = require('../targets')

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
  runRc(t, args.join(' '), {}, function (rc) {
    t.equal(rc.all, false, 'default is not building all targets')
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

test('using --all will build for all targets', function (t) {
  var args = [
    '--target vX.Y.Z',
    '--target vZ.Y.X',
    '--all'
  ]
  runRc(t, args.join(' '), {}, function (rc) {
    t.equal(rc.all, true, 'should be true')
    t.deepEqual(rc.target, targets, 'targets picked from targets.js')
    t.end()
  })
})

test('npm args are passed on from npm environment into rc', function (t) {
  var env = {
    npm_config_argv: JSON.stringify({
      cooked: [
        '--compile',
        '--build-from-source',
        '--debug'
      ]
    })
  }
  runRc(t, '', env, function (rc) {
    t.equal(rc['build-from-source'], true, '--build-from-source works')
    t.equal(rc.compile, true, 'compile should be true')
    t.equal(rc.debug, true, 'debug should be true')
    t.end()
  })
})

test('npm_config_* are passed on from environment into rc', function (t) {
  var env = {
    npm_config_proxy: 'PROXY',
    npm_config_https_proxy: 'HTTPS_PROXY',
    npm_config_local_address: 'LOCAL_ADDRESS'
  }
  runRc(t, '', env, function (rc) {
    t.equal(rc.proxy, 'PROXY', 'proxy is set')
    t.equal(rc['https-proxy'], 'HTTPS_PROXY', 'https-proxy is set')
    t.equal(rc['local-address'], 'LOCAL_ADDRESS', 'local-address is set')
    t.end()
  })
})

function runRc (t, args, env, cb) {
  var cmd = 'node ' + path.resolve(__dirname, '..', 'rc.js') + ' ' + args
  env = xtend(process.env, env)
  exec(cmd, { env: env }, function (err, stdout, stderr) {
    t.error(err, 'no error')
    t.equal(stderr.length, 0, 'no stderr')
    var result
    try {
      result = JSON.parse(stdout.toString())
      t.pass('json parsed correctly')
    } catch (e) {
      t.fail(e.message)
    }
    cb(result)
  })
}
