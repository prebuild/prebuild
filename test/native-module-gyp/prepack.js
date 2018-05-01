var fs = require('fs')
var assert = require('assert')

assert.equal(fs.existsSync('./build/Release/native.node'), true)
