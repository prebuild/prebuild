var collectArtifacts = require('../collect-artifacts')
var rc = require('../rc')
var test = require('tape')
var path = require('path')

test('normal mode, only collect .node', function (t) {
  var release = path.join(__dirname, 'fixture', 'multiple-files')

  collectArtifacts(release, rc, function (err, collected) {
    t.error(err, 'collected file')
    t.equal(collected.length, 1, 'found one file')
    t.deepEqual(collected, [path.join(release, 'test.node')])
    t.end()
  })
})

test('collect .node and .out', function (t) {
  var release = path.join(__dirname, 'fixture', 'multiple-files')
  var opts = {
    'include-regex': /\.(out|node)$/i
  }
  collectArtifacts(release, opts, function (err, collected) {
    t.error(err, 'collected files')
    t.equal(collected.length, 2, 'found two files')

    t.deepEqual(collected.sort(), [
      path.join(release, 'test.node'),
      path.join(release, 'test.out')
    ])
    t.end()
  })
})

test('collect recursively', function (t) {
  var release = path.join(__dirname, 'fixture', 'multiple-files-nested')
  var opts = {
    'include-regex': /\.(out|node|lib)$/i
  }
  collectArtifacts(release, opts, function (err, collected) {
    t.error(err, 'collected files')
    t.equal(collected.length, 3, 'found three files')

    t.deepEqual(collected.sort(), [
      path.join(release, 'lib', 'test.lib'),
      path.join(release, 'test.node'),
      path.join(release, 'test.out')
    ])
    t.end()
  })
})
