var fs = require('fs')
var assert = require('assert')

assert.strictEqual(fs.existsSync('./build/Release/native.node'), true)
