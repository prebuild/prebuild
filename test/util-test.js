var test = require('tape')
var fs = require('fs')
var home = require('home-dir')
var cp = require('child_process')
var EventEmitter = require('events').EventEmitter
var util = require('../util')

var spawn = util.spawn

test('prebuildCache() for different environments', function (t) {
  var APPDATA = process.env.APPDATA = 'somepathhere'
  t.equal(util.prebuildCache(), APPDATA + '/npm-cache/_prebuilds', 'APPDATA set')
  delete process.env.APPDATA
  t.equal(util.prebuildCache(), home() + '/.npm/_prebuilds', 'APPDATA not set')
  t.end()
})

test('cachedPrebuild() converts url to valid characters', function (t) {
  var url = 'https://github.com/level/leveldown/releases/download/v1.4.0/leveldown-v1.4.0-node-v14-linux-x64.tar.gz'
  var tail = 'https-github.com-level-leveldown-releases-download-v1.4.0-leveldown-v1.4.0-node-v14-linux-x64.tar.gz'
  var cached = util.cachedPrebuild(url)
  t.ok(cached.indexOf(tail))
  t.end()
})

test('tempFile() ends with pid and random number', function (t) {
  var url = 'https://github.com/level/leveldown/releases/download/v1.4.0/leveldown-v1.4.0-node-v14-linux-x64.tar.gz'
  var cached = util.cachedPrebuild(url)
  var tempFile = util.tempFile(cached)
  var regexp = /(\S+)\.(\d+)-([a-f0-9]+)\.tmp$/gi
  var match = regexp.exec(tempFile)
  t.ok(match, 'matches')
  t.equal(match[1], cached, 'starts with cached file name')
  fs.exists(tempFile, function (exists) {
    t.equal(exists, false, 'file should not exist yet')
    t.end()
  })
})

test('urlTemplate() returns different templates based on pkg and rc', function (t) {
  var o1 = {rc: {download: 'd0000d'}}
  var t1 = util.urlTemplate(o1)
  t.equal(t1, 'd0000d', 'template based on --download <string>')
  var o2 = {
    pkg: {binary: {host: 'http://foo.com'}},
    rc: {}
  }
  var t2 = util.urlTemplate(o2)
  t.equal(t2, 'http://foo.com/{name}-v{version}-node-v{abi}-{platform}-{arch}.tar.gz', 'template based on pkg.binary properties')
  var o3 = {
    pkg: {binary: {host: 'http://foo.com'}},
    rc: {download: true}
  }
  var t3 = util.urlTemplate(o3)
  t.equal(t3, t2, 'pkg: {} takes precedence over --download')
  var o4 = {
    pkg: {binary: {host: 'http://foo.com'}},
    rc: {download: 'd0000d'}
  }
  var t4 = util.urlTemplate(o4)
  t.equal(t4, t1, '--download <string> always goes first')
  var o5 = {
    pkg: {binary: {host: 'http://foo.com', remote_path: 'w00t'}},
    rc: {}
  }
  var t5 = util.urlTemplate(o5)
  t.equal(t5, 'http://foo.com/w00t/{name}-v{version}-node-v{abi}-{platform}-{arch}.tar.gz', 'pkg.binary.remote_path is added after host, default format')
  var o6 = {
    pkg: {
      binary: {
        host: 'http://foo.com',
        remote_path: 'w00t',
        package_name: '{name}-{major}.{minor}-node-v{abi}-{platform}-{arch}.tar.gz'
      }
    },
    rc: {}
  }
  var t6 = util.urlTemplate(o6)
  t.equal(t6, 'http://foo.com/w00t/{name}-{major}.{minor}-node-v{abi}-{platform}-{arch}.tar.gz', 'pkg.binary.package_name is added after host and remote_path, custom format')
  var o7 = {pkg: require('../package.json'), rc: {download: true}}
  var t7 = util.urlTemplate(o7)
  t.equal(t7, 'https://github.com/mafintosh/prebuild/releases/download/v{version}/{name}-v{version}-node-v{abi}-{platform}-{arch}.tar.gz', '--download with no arguments, no pkg.binary, default format')
  t.end()
})

test('urlTemplate() with pkg.binary cleans up leading ./ or / and trailing /', function (t) {
  var expected = 'http://foo.com/w00t/{name}-{major}.{minor}-node-v{abi}-{platform}-{arch}.tar.gz'
  var o = {
    pkg: {
      binary: {
        host: 'http://foo.com/',
        remote_path: '/w00t',
        package_name: '/{name}-{major}.{minor}-node-v{abi}-{platform}-{arch}.tar.gz'
      }
    },
    rc: {}
  }
  t.equal(util.urlTemplate(o), expected)
  o.pkg.binary = {
    host: 'http://foo.com/',
    remote_path: './w00t/',
    package_name: './{name}-{major}.{minor}-node-v{abi}-{platform}-{arch}.tar.gz'
  }
  t.equal(util.urlTemplate(o), expected)
  o.pkg.binary = {
    host: 'http://foo.com/',
    remote_path: 'w00t/',
    package_name: '{name}-{major}.{minor}-node-v{abi}-{platform}-{arch}.tar.gz/'
  }
  t.equal(util.urlTemplate(o), expected)
  o.pkg.binary = {
    host: 'http://foo.com',
    remote_path: './w00t',
    package_name: '/{name}-{major}.{minor}-node-v{abi}-{platform}-{arch}.tar.gz/'
  }
  t.equal(util.urlTemplate(o), expected)
  t.end()
})

test('getDownloadUrl() expands template to correct values', function (t) {
  var abi = process.versions.modules
  var o1 = {
    pkg: {
      name: 'a-native-module',
      version: 'x.y.z-alpha5',
      binary: {
        host: 'https://foo.com',
        module_name: 'a-native-module-bindings',
        package_name: '{name}-{package_name}-{version}-{major}-{minor}-{patch}-{prerelease}-{abi}-{node_abi}-{platform}-{arch}-{configuration}-{module_name}'
      }
    },
    rc: {
      platform: 'coolplatform',
      arch: 'futureplatform'
    }
  }
  var url1 = util.getDownloadUrl(o1)
  t.equal(url1, 'https://foo.com/a-native-module-a-native-module-x.y.z-alpha5-x-y-z-alpha5-alpha5-' + abi + '-' + abi + '-coolplatform-futureplatform-Release-a-native-module-bindings', 'weird url but testing everything is propagated, with prerelease and Release')
  var o2 = {
    pkg: {
      name: 'a-native-module',
      version: 'x.y.z+beta77',
      binary: {
        host: 'https://foo.com',
        module_name: 'a-native-module-bindings',
        package_name: '{name}-{package_name}-{version}-{major}-{minor}-{patch}-{build}-{abi}-{node_abi}-{platform}-{arch}-{configuration}-{module_name}'
      }
    },
    rc: {
      platform: 'coolplatform',
      arch: 'futureplatform',
      debug: true
    }
  }
  var url2 = util.getDownloadUrl(o2)
  t.equal(url2, 'https://foo.com/a-native-module-a-native-module-x.y.z+beta77-x-y-z+beta77-beta77-' + abi + '-' + abi + '-coolplatform-futureplatform-Debug-a-native-module-bindings', 'weird url but testing everything is propagated, with build and Debug')
  var o3 = {
    pkg: {
      name: '@scope/a-native-module',
      version: 'x.y.z+beta77',
      binary: {
        host: 'https://foo.com',
        module_name: 'a-native-module-bindings',
        package_name: '{name}-{package_name}-{version}-{major}-{minor}-{patch}-{build}-{abi}-{node_abi}-{platform}-{arch}-{configuration}-{module_name}'
      }
    },
    rc: {
      platform: 'coolplatform',
      arch: 'futureplatform',
      debug: true
    }
  }
  var url3 = util.getDownloadUrl(o3)
  t.equal(url3, url2, 'scope does not matter for download url')
  t.end()
})

test('getTarPath based on package.json and rc config', function (t) {
  var opts = {
    pkg: {
      name: 'foo',
      version: 'X.Y.Z'
    },
    rc: {
      platform: 'fakeos',
      arch: 'x64'
    }
  }
  var tarPath = util.getTarPath(opts, 314)
  t.equal(tarPath, 'prebuilds/foo-vX.Y.Z-node-v314-fakeos-x64.tar.gz', 'correct tar path')
  t.end()
})

test('readGypFile reads file based on correct version', function (t) {
  var v = 'X.Y.Z'
  var file = 'node_version.h'
  var _readFile = fs.readFile
  fs.readFile = function (fpath, encoding, cb) {
    t.equal(fpath, home() + '/.node-gyp/' + v + '/src/' + file, 'corect file name')
    cb()
  }
  util.readGypFile(v, file, function (err, data) {
    t.error(err, 'readGypFile should succeed')
    fs.readFile = _readFile
    t.end()
  })
})

test('readGypFile errors if fs.readFile errors', function (t) {
  var v = 'X.Y.Z'
  var file = 'src/node_version.h'
  var _readFile = fs.readFile
  var error = new Error('sorry dude, no such file')
  fs.readFile = function (fpath, encoding, cb) {
    process.nextTick(cb.bind(null, error))
  }
  util.readGypFile(v, file, function (err, data) {
    fs.readFile = _readFile
    t.deepEqual(err, error, 'expected error')
    t.end()
  })
})

test('spawn(): no args default to empty array', function (t) {
  cp.spawn = function (cmd, args, opts) {
    t.equal(cmd, 'foo', 'correct command')
    t.deepEqual(args, [], 'default args')
    t.deepEqual(opts, {stdio: 'inherit'}, 'inherit stdio')
    return {
      on: function (id, cb) {
        t.equal(id, 'exit', 'listener on exit event')
        t.end()
      }
    }
  }
  spawn('foo')
})

test('spawn(): callback fires with no error on exit code 0', function (t) {
  cp.spawn = function (cmd, args, opts) {
    t.deepEqual(args, ['arg1', 'arg2'], 'correct args')
    return new EventEmitter()
  }
  spawn('foo', ['arg1', 'arg2'], function (err) {
    t.error(err, 'no error')
    t.end()
  }).emit('exit', 0)
})

test('spawn(): callback fires with error on non 0 exit code', function (t) {
  cp.spawn = function () { return new EventEmitter() }
  spawn('foo', ['arg1'], function (err) {
    t.equal(err.message, 'foo arg1 failed with exit code 314', 'correct error')
    t.end()
  }).emit('exit', 314)
})

test('releaseFolder(): depends on package.json and --debug', function (t) {
  var folder = util.releaseFolder
  t.equal(folder({rc: {}, pkg: {}}), 'build/Release', 'Release is default')
  t.equal(folder({
    rc: { debug: false },
    pkg: {}
  }), 'build/Release', 'Release is default')
  t.equal(folder({
    rc: { debug: true },
    pkg: {}
  }), 'build/Debug', 'Debug folder when --debug')
  t.equal(folder({
    rc: { debug: true },
    pkg: { binary: { module_path: 'foo/bar' } }
  }), 'foo/bar', 'using binary property from package.json')
  t.end()
})

test('nodeGypPath(): accepts any arguments', function (t) {
  var nodeGypPath = util.nodeGypPath
  t.equal(nodeGypPath('0.10.40', 'include/node'),
          home() + '/.node-gyp/0.10.40/include/node')
  t.equal(nodeGypPath('4.1.0', 'include/node', 'node.h'),
          home() + '/.node-gyp/4.1.0/include/node/node.h')
  t.equal(nodeGypPath('/iojs-1.0.4/', '/include/node/', '/node.h'),
          home() + '/.node-gyp/iojs-1.0.4/include/node/node.h',
          'trailing slashes should not matter')
  t.end()
})
