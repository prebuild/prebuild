var test = require('tape')
var util = require('../util')
var abi = require('../abi')
var error = require('../error')

test('getAbiFromTarget calculates correct Node ABI', function (t) {
  t.equal(abi.getAbiFromTarget(undefined), process.versions.modules)
  t.equal(abi.getAbiFromTarget(null), process.versions.modules)
  t.throws(function () { abi.getAbiFromTarget('a.b.c') })
  t.throws(function () { abi.getAbiFromTarget('1.0.0') })
  t.equal(abi.getAbiFromTarget('7.2.0'), '51')
  t.equal(abi.getAbiFromTarget('7.0.0'), '51')
  t.equal(abi.getAbiFromTarget('6.9.9'), '48')
  t.equal(abi.getAbiFromTarget('6.0.0'), '48')
  t.equal(abi.getAbiFromTarget('5.9.9'), '47')
  t.equal(abi.getAbiFromTarget('5.0.0'), '47')
  t.equal(abi.getAbiFromTarget('4.9.9'), '46')
  t.equal(abi.getAbiFromTarget('4.0.0'), '46')
  t.equal(abi.getAbiFromTarget('0.12.17'), '14')
  t.equal(abi.getAbiFromTarget('0.12.0'), '14')
  t.equal(abi.getAbiFromTarget('0.10.48'), '11')
  t.equal(abi.getAbiFromTarget('0.10.0'), '11')
  t.end()
})

test('getAbiFromTarget calculates correct Electron ABI', function (t) {
  t.throws(function () { abi.getAbiFromTarget(undefined, 'electron') })
  t.throws(function () { abi.getAbiFromTarget('7.2.0', 'electron') })
  t.equal(abi.getAbiFromTarget('1.4.0', 'electron'), '50')
  t.equal(abi.getAbiFromTarget('1.3.0', 'electron'), '49')
  t.equal(abi.getAbiFromTarget('1.2.0', 'electron'), '48')
  t.equal(abi.getAbiFromTarget('1.1.0', 'electron'), '48')
  t.equal(abi.getAbiFromTarget('1.0.0', 'electron'), '47')
  t.equal(abi.getAbiFromTarget('0.37.0', 'electron'), '47')
  t.equal(abi.getAbiFromTarget('0.36.0', 'electron'), '47')
  t.equal(abi.getAbiFromTarget('0.35.0', 'electron'), '46')
  t.equal(abi.getAbiFromTarget('0.34.0', 'electron'), '46')
  t.equal(abi.getAbiFromTarget('0.33.0', 'electron'), '46')
  t.equal(abi.getAbiFromTarget('0.32.0', 'electron'), '45')
  t.equal(abi.getAbiFromTarget('0.31.0', 'electron'), '45')
  t.equal(abi.getAbiFromTarget('0.30.0', 'electron'), '44')
  t.end()
})

test('src/node_version.h takes precedence over src/node.h', function (t) {
  var readCount = 0
  var v = 'vX.Y.Z'
  var _readGypFile = util.readGypFile
  util.readGypFile = function (opts, cb) {
    t.equal(opts.version, 'X.Y.Z', 'correct version, v stripped')
    if (readCount++ === 0) {
      t.equal(opts.file, 'node_version.h', 'correct file')
      process.nextTick(cb.bind(null, null, '#define NODE_MODULE_VERSION 666'))
    } else {
      t.equal(opts.file, 'node.h', 'correct file')
      process.nextTick(cb.bind(null, null, '#define NODE_MODULE_VERSION 314'))
    }
  }
  abi.getAbi({}, v, function (err, abi) {
    t.error(err, 'getAbi should not fail')
    t.equal(abi, '666', 'abi version taken from src/node_version.h')
    util.readGypFile = _readGypFile
    t.end()
  })
})

test('abi taken from src/node.h if no define in src/node_version.h', function (t) {
  var readCount = 0
  var v = 'vX.Y.Z'
  var _readGypFile = util.readGypFile
  util.readGypFile = function (opts, cb) {
    if (readCount++ === 0) {
      process.nextTick(cb.bind(null, null, 'no proper define here!'))
    } else {
      process.nextTick(cb.bind(null, null, '#define NODE_MODULE_VERSION 314'))
    }
  }
  abi.getAbi({}, v, function (err, abi) {
    t.error(err, 'getAbi should not fail')
    t.equal(abi, '314', 'abi version taken from src/node.h')
    util.readGypFile = _readGypFile
    t.end()
  })
})

test('getAbi calls back with error if no abi could be found', function (t) {
  var v = 'vX.Y.Z'
  var _readGypFile = util.readGypFile
  util.readGypFile = function (opts, cb) {
    process.nextTick(cb.bind(null, null, 'no proper define here!'))
  }
  abi.getAbi({}, v, function (err, abi) {
    t.same(err, error.noAbi(v), 'correct error')
    util.readGypFile = _readGypFile
    t.end()
  })
})

test('missing src/node_version.h will run node-gyp-install and retry', function (t) {
  t.plan(5)
  var readCount = 0
  var v = 'vX.Y.Z'
  var _readGypFile = util.readGypFile
  util.readGypFile = function (opts, cb) {
    if (readCount++ === 0) {
      process.nextTick(cb.bind(null, {code: 'ENOENT'}))
    } else {
      process.nextTick(cb.bind(null, null, '#define NODE_MODULE_VERSION 555'))
    }
  }
  var opts = {
    install: function (o, v, cb) {
      t.equal(v, 'X.Y.Z', 'correct version')
      t.equal(o.force, true, 'forcing install')
      process.nextTick(cb)
    }
  }
  abi.getAbi(opts, v, function (err, abi) {
    t.error(err, 'getAbi should not fail')
    t.equal(readCount, 3, 'read three times')
    t.equal(abi, '555', 'abi version after retry')
    util.readGypFile = _readGypFile
    t.end()
  })
})

// TODO add tests for node-ninja
