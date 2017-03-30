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
    'collect-files-filter': /\.(out|node)$/i
  }
  collectArtifacts(release, opts, function (err, collected) {
    t.error(err, 'collected files')
    t.equal(collected.length, 2, 'found two files')

    // ensure the files are always in the same order
    collected.sort()

    t.deepEqual(collected, [
      path.join(release, 'test.node'),
      path.join(release, 'test.out')
    ])
    t.end()
  })
})
