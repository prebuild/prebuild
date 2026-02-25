const fs = require('fs')
const assert = require('assert')

assert.strictEqual(fs.existsSync('./build/Release/native.node'), true)
