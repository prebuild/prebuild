var test = require('tape')
var util = require('../util')
var getAbi = require('../abi')

test('src/node_version.h takes precedence over src/node.h', function (t) {
  var readCount = 0
  var v = 'vX.Y.Z'
  var _readGypFile = util.readGypFile
  util.readGypFile = function (version, file, cb) {
    t.equal(version, 'X.Y.Z', 'correct version, v stripped')
    if (readCount++ === 0) {
      t.equal(file, 'node_version.h', 'correct file')
      process.nextTick(cb.bind(null, null, '#define NODE_MODULE_VERSION 666'))
    } else {
      t.equal(file, 'node.h', 'correct file')
      process.nextTick(cb.bind(null, null, '#define NODE_MODULE_VERSION 314'))
    }
  }
  getAbi({}, v, function (err, abi) {
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
  util.readGypFile = function (version, file, cb) {
    if (readCount++ === 0) {
      process.nextTick(cb.bind(null, null, 'no proper define here!'))
    } else {
      process.nextTick(cb.bind(null, null, '#define NODE_MODULE_VERSION 314'))
    }
  }
  getAbi({}, v, function (err, abi) {
    t.error(err, 'getAbi should not fail')
    t.equal(abi, '314', 'abi version taken from src/node.h')
    util.readGypFile = _readGypFile
    t.end()
  })
})

test('getAbi calls back with error if no abi could be found', function (t) {
  var v = 'vX.Y.Z'
  var _readGypFile = util.readGypFile
  util.readGypFile = function (version, file, cb) {
    process.nextTick(cb.bind(null, null, 'no proper define here!'))
  }
  getAbi({}, v, function (err, abi) {
    t.equal(err.message, 'Could not detect abi for X.Y.Z', 'correct error')
    util.readGypFile = _readGypFile
    t.end()
  })
})

test('missing src/node_version.h will run node-gyp-install and retry', function (t) {
  t.plan(5)
  var readCount = 0
  var v = 'vX.Y.Z'
  var _readGypFile = util.readGypFile
  util.readGypFile = function (version, file, cb) {
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
  getAbi(opts, v, function (err, abi) {
    t.error(err, 'getAbi should not fail')
    t.equal(readCount, 3, 'read three times')
    t.equal(abi, '555', 'abi version after retry')
    util.readGypFile = _readGypFile
    t.end()
  })
})
