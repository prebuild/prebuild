#!/usr/bin/env node

var gyp = require('node-gyp')()
var path = require('path')
var install = require('node-gyp-install')
var log = require('npmlog')
var zlib = require('zlib')
var tar = require('tar-stream')
var tfs = require('tar-fs')
var fs = require('fs')
var pump = require('pump')
var request = require('request')
var github = require('github-from-package')
var ghreleases = require('ghreleases')
var proc = require('child_process')
var rc = require('./rc')

if (rc.path) process.chdir(rc.path)

if (rc.version) {
  console.log(require('./package.json').version)
  process.exit(0)
}

var HOME = process.env.HOME || process.env.USERPROFILE
var NPM = process.env.APPDATA ? path.join(process.env.APPDATA, 'npm-cache') : path.join(HOME, '.npm')
var NODE_GYP = path.join(HOME, '.node-gyp')
var NPM_CACHE = path.join(NPM, '_prebuilds')

log.heading = 'prebuild'
if (process.env.npm_config_loglevel && !rc.verbose) log.level = process.env.npm_config_loglevel

if (!fs.existsSync('package.json')) {
  log.error('setup', 'No package.json found. Aborting...')
  process.exit(1)
}

var pkg = require(path.resolve('package.json'))

if (rc.help) {
  console.error(fs.readFileSync(path.join(__dirname, 'help.txt'), 'utf-8'))
  process.exit(0)
}

if (rc.compile) return build(process.version, onbuilderror)
if (rc.download) return downloadPrebuild()

var targets = [].concat(rc.target)
var buildLog = log.info.bind(log, 'build')
var files = []

prebuild(targets.shift(), function done (err, result) {
  if (err) return onbuilderror(err)

  files.push(result.path)
  if (targets.length) return prebuild(targets.shift(), done)
  if (!rc.upload) return

  var url = github(pkg)
  if (!url) return onbuilderror(new Error('package.json is missing a repository field'))

  buildLog('Uploading prebuilds to Github releases')
  var user = url.split('/')[3]
  var repo = url.split('/')[4]
  var auth = {user: 'x-oauth', token: rc.upload}
  var tag = 'v' + pkg.version

  ghreleases.create(auth, user, repo, {tag_name: tag}, function () {
    ghreleases.getByTag(auth, user, repo, tag, function (err, release) {
      if (err) return onbuilderror(err)

      files = files.filter(function (file) {
        return !release.assets.some(function (asset) {
          return asset.name === path.basename(file)
        })
      })

      ghreleases.uploadAssets(auth, user, repo, 'tags/' + tag, files, function (err) {
        if (err) return onbuilderror(err)
        buildLog('Uploaded ' + files.length + ' new prebuild(s) to Github')
      })
    })
  })
})

function downloadPrebuild () {
  var url = getDownloadUrl()
  var cache = path.join(NPM_CACHE, url.replace(/[^a-zA-Z0-9.]+/g, '-'))
  var tmp = cache + '.' + process.pid + '-' + Math.random().toString(16).slice(2) + '.tmp'
  var binaryName

  fs.exists(cache, function (exists) {
    if (exists) return unpack()

    var req = request(url)
    var status = 0

    log.http('request', 'GET ' + url)
    req.on('response', function (res) {
      status = res.statusCode
      log.http(res.statusCode, url)
    })

    fs.mkdir(NPM_CACHE, function () {
      pump(req, fs.createWriteStream(tmp), function (err) {
        if (err) return compile(err)

        if (status !== 200) return fs.unlink(tmp, compile)

        fs.rename(tmp, cache, function (err) {
          if (err) return compile(err)
          unpack()
        })
      })
    })
  })

  function getDownloadUrl () {
    return expand(urlTemplate(), {
      name: pkg.name,
      package_name: pkg.name,
      version: pkg.version,
      major: pkg.version.split('.')[0],
      minor: pkg.version.split('.')[1],
      patch: pkg.version.split('.')[2],
      prerelease: pkg.version.split('-')[1],
      build: pkg.version.split('+')[1],
      abi: process.versions.modules,
      node_abi: process.versions.modules,
      platform: rc.platform,
      arch: rc.arch,
      configuration: (rc.debug ? 'Debug' : 'Release'),
      module_name: pkg.binary && pkg.binary.module_name
    })
  }

  function expand (template, values) {
    Object.keys(values).forEach(function (key) {
      var regexp = new RegExp('\{' + key + '\}', 'g')
      template = template.replace(regexp, values[key])
    })
    return template
  }

  function urlTemplate () {
    if (typeof rc.download == 'string') return rc.download
    var packageName = '{name}-v{version}-node-v{abi}-{platform}-{arch}.tar.gz'
    if (rc.download === true && !pkg.binary) {
      return github(pkg) + '/releases/download/v{version}/' + packageName
    }
    if (pkg.binary) {
      var host = pkg.binary.host + '/'
      if (pkg.binary.remote_path) host += pkg.binary.remote_path + '/'
      return host + (pkg.binary.package_name || packageName)
    }
  }

  function updateName (entry) {
    if (/\.node$/i.test(entry.name)) binaryName = entry.name
  }

  function unpack () {
    pump(fs.createReadStream(cache), zlib.createGunzip(), tfs.extract('.', {readable: true, writable: true}).on('entry', updateName), function (err) {
      if (err) return compile(err)
      if (binaryName) {
        try {
          require(path.resolve(binaryName))
        } catch (err) {
          return compile(err)
        }
      }
      log.info('install', 'Prebuild successfully installed!')
    })
  }

  function compile (err) {
    if (err) log.warn('install', err.message)
    log.info('install', 'Could not install prebuild. Falling back to compilation')
    build(process.version, onbuilderror)
  }
}

function getAbi (version, cb) {
  version = version.replace('v', '')
  fs.readFile(path.join(NODE_GYP, version, 'src/node_version.h'), 'utf-8', function (err, a) {
    if (err && err.code === 'ENOENT') return retry()
    if (err) return cb(err)
    fs.readFile(path.join(NODE_GYP, version, 'src/node.h'), 'utf-8', function (err, b) {
      if (err && err.code === 'ENOENT') return retry()
      if (err) return cb(err)
      var abi = parse(a) || parse(b)
      if (!abi) return cb(new Error('Could not detect abi for ' + version))
      cb(null, abi)
    })
  })

  function retry () {
    install({log: buildLog, version: version, force: true}, function (err) {
      if (err) return cb(err)
      getAbi(version, cb)
    })
  }

  function parse (file) {
    var res = file.match(/#define\s+NODE_MODULE_VERSION\s+\(?(\d+)/)
    return res && res[1]
  }
}

function runGyp (version, cb) {
  if (!rc.preinstall) return run()

  proc.spawn(rc.preinstall, {stdio: 'inherit'}).on('exit', function (code) {
    if (code) process.exit(code)
    run()
  })

  function run () {
    gyp.parseArgv(['node', 'index.js', 'rebuild', '--target=' + version, '--target_arch=' + rc.arch])
    if (rc.verbose) log.level = undefined
    gyp.commands.rebuild(gyp.todo.shift().args, function run (err) {
      if (err) return cb(err)
      if (!gyp.todo.length) return cb()
      if (gyp.todo[0].name === 'configure') configurePreGyp()
      gyp.commands[gyp.todo[0].name](gyp.todo.shift().args, run)
    })
  }
}

function configurePreGyp () {
  if (pkg.binary && pkg.binary.module_name) {
    gyp.todo[0].args.push('-Dmodule_name=' + pkg.binary.module_name)
  }
  if (pkg.binary && pkg.binary.module_path) {
    gyp.todo[0].args.push('-Dmodule_path=' + pkg.binary.module_path)
  }
}

function build (version, cb) {
  var release = (pkg.binary && pkg.binary.module_path) || 'build/Release'

  install({log: buildLog, version: version}, function (err) {
    if (err) return cb(err)
    runGyp(version, function (err) {
      if (err) return cb(err)
      done()
    })
  })

  function done () {
    fs.readdir(release, function (err, files) {
      if (err) return cb(err)

      for (var i = 0; i < files.length; i++) {
        if (/\.node$/i.test(files[i])) return cb(null, path.join(release, files[i]), files[i])
      }

      cb(new Error('Could not find build in ' + release))
    })
  }
}

function prebuild (v, cb) {
  if (v[0] !== 'v') v = 'v' + v
  buildLog('Preparing to prebuild ' + pkg.name + '@' + pkg.version + ' for ' + v + ' on ' + rc.platform + '-' + rc.arch)
  getAbi(v, function (err, abi) {
    if (err) return log.error('build', err.message)
    var tarPath = getTarPath(abi)
    var next = function (err) {
      if (err) return cb(err)
      cb(null, { path: tarPath, abi: abi, version: v, platform: rc.platform, arch: rc.arch})
    }
    fs.stat(tarPath, function (err, st) {
      if (!err && !rc.force) {
        buildLog(tarPath + ' exists, skipping build')
        return next()
      }
      build(v, function (err, filename) {
        if (err) return cb(err)
        pack(filename, tarPath, next)
      })
    })
  })

  function pack (filename, tarPath, cb) {
    fs.mkdir('prebuilds', function () {
      fs.stat(filename, function (err, st) {
        if (err) return cb(err)

        var pack = tar.pack()
        var ws = fs.createWriteStream(tarPath)
        var stream = pack.entry({
          name: filename.replace(/\\/g, '/').replace(/:/g, '_'),
          size: st.size,
          mode: st.mode | 0444 | 0222,
          gid: st.gid,
          uid: st.uid
        })

        fs.createReadStream(filename).pipe(stream).on('finish', function () {
          pack.finalize()
        })

        pack.pipe(zlib.createGzip()).pipe(ws).on('close', function () {
          buildLog('Prebuild written to ' + tarPath)
          cb()
        })
      })
    })
  }
}

function onbuilderror (err) {
  if (!err) return
  log.error('build', err.message)
  process.exit(2)
}

function getTarPath (abi) {
  var name = pkg.name + '-v' + pkg.version + '-node-v' + abi + '-' + rc.platform + '-' + rc.arch + '.tar.gz'
  return path.join('prebuilds', name)
}
