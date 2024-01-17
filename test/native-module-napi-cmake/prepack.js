const fs = require('fs')
const assert = require('assert')

assert.strictEqual(fs.existsSync('./build/Release/prebuild-napi-test-cmake.node'), true)
