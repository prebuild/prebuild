# prebuild

A command line tool for easily doing prebuilds for multiple version of node/iojs on a specific platform.

```
$ npm install -g prebuild
```

[![build status](http://img.shields.io/travis/mafintosh/prebuild.svg?style=flat)](http://travis-ci.org/mafintosh/prebuild) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

## Features

* Builds native modules for any version of node/iojs, without having to switch between different versions of node/iojs to do so. This works by only downloading the correct headers and telling `node-gyp` to use those instead of the ones installed on your system.
* Upload (`--upload`) prebuilt binaries to GitHub.
* Installs (`--install`) prebuilt binaries from GitHub by default or from a host of your choice. The url format can be customized as you see fit.
* Installed binaries are cached in `~/.npm/_prebuilds/` so you only need to download them once.
* Support for stripping (`--strip`) debug information.

## Building

Building is only required for targets with different [ABI](https://en.wikipedia.org/wiki/Application_binary_interface) versions. To build for all *supported* abi versions greater than `0.8` ([example from leveldown](https://github.com/Level/leveldown/blob/ea5999dbd5fddf8f811b6c14162a3282b24ef7a9/package.json#L55)):

```
prebuild --all
```

Alternatively, to build for some specific versions you can do:

```
prebuild -b 0.10.42 -b 0.12.10 -b 4.3.0
```

See [`targets.js`](https://github.com/mafintosh/prebuild/blob/master/targets.js) for currently available versions.

For more options run `prebuild --help`. The prebuilds created are compatible with [node-pre-gyp](https://github.com/mapbox/node-pre-gyp)


## Uploading

`prebuild` supports uploading prebuilds to GitHub releases. If the release doesn't exist, it will be created for you. To upload prebuilds simply add the `-u <github-token>` option:

```
$ prebuild --all -u <github-token>
```

If you don't want to use the token on cli you can put it in `~/.prebuildrc`:

```
upload=<github-token>
```

Note that `--upload` will only upload the targets that was built and stored in `./prebuilds`, so `prebuild -u <github-token> -b 4.3.0` will only upload the binary for the `4.3.0` target.

You can use `prebuild --upload-all` to upload all files from the `./prebuilds` folder.

## Installing

`prebuild` supports installing prebuilt binaries from GitHub by default. To install for your platform, use the `--install` flag.

```
$ prebuild --install
```

If no suitable binary can be found, `prebuild` will fallback to `node-gyp rebuild`. Native modules that have a javascript fallback can use `--no-compile` to prevent this.

Once a binary has been downloaded `prebuild` will `require()` the module and if that fails it will also fallback to building it.

Installed binaries are cached in your npm cache meaning you'll only have to download them once.

Add `prebuild --install` to your `package.json` so the binaries will be installed when the module is installed

```json
{
  "name": "a-native-module",
  "scripts": {
    "install": "prebuild --install"
  },
  "dependencies": {
    "prebuild": "^4.0.0"
  }
}
```

If you are hosting your binaries elsewhere you can provide a host to the `--install` flag. The host string can also be a template for constructing more intrinsic urls. Install from `example.com` with a custom format for the binary name:

```
$ prebuild --install https://example.com/{name}-{version}-{abi}-{platform}{libc}-{arch}.tar.gz
```

`--install` will download binaries when installing from npm and compile in other cases. If you want `prebuild` to always download binaries you can use `--download` instead of `--install`. Either way, if downloading fails for any reason, it will fallback to compiling the code.

There's also support for `node-pre-gyp` style by utilizing the `binary` property in `package.json`.

### Formatting urls

The following placeholders can be used:

* `{name}` or `{package_name}`: the package name taken from `package.json`
* `{version}`: package version taken from `package.json`
* `{major}`: major version taken from `version`
* `{minor}`: minor version taken from `version`
* `{patch}`: patch version taken from `version`
* `{prerelease}`: prelease version taken from `version`
* `{build}`: build version taken from `version`
* `{abi}` or `{node_abi}`: ABI version of node/iojs taken from current `--target` or `process.version` if not specified, see `ABI` section below for more information
* `{platform}`: platform taken from `--platform` or `process.platform` if not specified
* `{arch}`: architecture taken from `--arch` or `process.arch` if not specified
* `{libc}`: libc setting for alternative libc taken from `--libc` or LIBC env var or blank if not specified
* `{configuration}`: `'Debug'` if `--debug` is specified, otherwise `'Release'`
* `{module_name}`: taken from `binary.module_name` property from `package.json`

## Create GitHub Token

A GitHub token is needed for two reasons:

* Create a GitHub release ([leveldown example](https://github.com/Level/leveldown/releases/tag/v1.4.4))
* Upload the prebuilt binaries to that release

To create a token:

* Go to [this page](https://github.com/settings/tokens)
* Click the `Generate new token` button
* Give the token a name and click the `Generate token` button, see below

![create token](images/create-token.png)

The default scopes should be fine.

## Help

```
$ prebuild -h
prebuild [options]

  --path        -p  path        (make a prebuild here)
  --target      -t  version     (version to build or install for)
  --prebuild    -b  version     (version to prebuild against)
  --all                         (prebuild for all known abi versions)
  --install                     (download when using npm, compile otherwise)
  --download    -d  [url]       (download prebuilds, no url means github)
  --upload      -u  [gh-token]  (upload prebuilds to github)
  --upload-all  -u  [gh-token]  (upload all files from ./prebuilds folder to github)
  --preinstall  -i  script      (run this script before prebuilding)
  --compile     -c              (compile your project using node-gyp)
  --no-compile                  (skip compile fallback when downloading)
  --abi                         (use provided abi rather than system abi)
  --libc                        (use provided libc rather than system default)
  --backend                     (specify build backend, default is 'node-gyp')
  --strip                       (strip debug information)
  --debug                       (set Debug or Release configuration)
  --verbose                     (log verbosely)
  --version                     (print prebuild version and exit)
```

## JavaScript API

```js
var prebuild = require('prebuild')
```

### .download(opts, cb)

Options:

- `.pkg` the parsed `package.json`
- `.log` (optional)
- `.nolocal` Don't check for cached builds (optional)
- `.updateName` Function to update the binary name (optional)
- `.path` Location of the module (default: `"."`)
- `.abi` Node ABI version (default: `process.versions.modules`)
- `.libc` OS libc (default: blank)
- `.platform` OS platform (default: `process.platform`)
- `.download` Precomputed url to download the binary from (optional)
- `.all` (default: `false`)
- `.force` (default: `false`)
- `.proxy` (default: `process.env['HTTP_PROXY']`)
- `.https-proxy` (default: `process.env['HTTP-PROXY']`)`

Example:

```js
prebuild.download({
  pkg: require('./package.json')
}, function (err) {
  // ...
})
```

### .build(opts, version, cb)

Options:

- `.log` (optional)
- `.preinstall` (optional)
- `.gyp` Provide a custom `node-gyp` instance (optional)
- `.backend` Provide a custom `node-gyp` instance via string. Alternatives are `'node-gyp'` and `'node-ninja'` (optional, defaults to `'node-gyp'`)
- `.args` Additional command line arguments to `node-gyp` (optional)
- `.debug` Pass in `--debug` on command line to gyp backend (optional)

Example:

```js
prebuild.build({}, version, function (err) {
  // ...
})
```
### Global options:

- `.debug` Download or build a debug build (default: `false`)
- `.arch` Processor architecture (default: `process.arch`)

## Develop `prebuild`

If you want to hack on `prebuild` you need an environment to play around with. We recommend a setup similar
to the following:

* A fork of `prebuild`
* A GitHub token (see above)
* A native node module

```bash
$ git clone git@github.com:<your-nick>/prebuild
$ cd prebuild && npm link && cd ..
$ git clone git@github.com:<your-nick>/some-native-module
```

Since you did `npm link` on `prebuild` it will be installed globally. Now you can go ahead and try things out.

```bash
$ cd some-native-module
$ prebuild --all --strip -u <github-token>
```

This command would:

* Build `some-native-module` for all targets listed in `targets.js` and store them in `./prebuilds/`
* Strip binaries from debug information
* Create a release on GitHub, if needed
* Upload all binaries to that release, if not already uploaded

Before you commit your changes and send us a pull request, do run `npm test`.

## License

MIT
