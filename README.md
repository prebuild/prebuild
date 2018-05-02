# prebuild

> A command line tool for easily making prebuilt binaries for multiple versions of [Node.js](https://nodejs.org/en/), [Electron](http://electron.atom.io/) and [NW.js](https://nwjs.io/) on a specific platform.

```
$ npm install -g prebuild
```

[![npm](https://img.shields.io/npm/v/prebuild.svg)](https://www.npmjs.com/package/prebuild)
![Node version](https://img.shields.io/node/v/prebuild.svg)
[![build status](http://img.shields.io/travis/prebuild/prebuild.svg?style=flat)](http://travis-ci.org/prebuild/prebuild)
[![Build status](https://ci.appveyor.com/api/projects/status/oy1kk4fpy51net0v/branch/master?svg=true)](https://ci.appveyor.com/project/mathiask88/prebuild)
[![david](https://david-dm.org/prebuild/prebuild.svg)](https://david-dm.org/prebuild/prebuild)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

## Features

* Builds native modules for any version of Node.js, Electron or NW.js, without having to switch between different versions to do so. This works by only downloading the correct headers and telling `node-gyp` to use those instead of the ones installed on your system.
* Upload (`--upload`) prebuilt binaries to GitHub.
* Support for stripping (`--strip`) debug information. Strip command defaults to `strip` but can be overridden by the `STRIP` environment variable.
* Install prebuilt modules via [`prebuild-install`](https://github.com/prebuild/prebuild-install).

## Building

Building is only required for targets with different [ABI](https://en.wikipedia.org/wiki/Application_binary_interface) versions. To build for all *supported* ABI versions ([example from leveldown](https://github.com/Level/leveldown/blob/ea5999dbd5fddf8f811b6c14162a3282b24ef7a9/package.json#L55)):

```
prebuild --all
```

*Supported* ABI versions may change over time without a new prebuild release.

Alternatively, to build for some specific versions you can do:

```
prebuild -t 0.10.42 -t 0.12.10 -t 4.3.0
```

To build against Electron headers, do:

```
prebuild -t 1.4.10 -r electron
```

To build against NW.js headers, do:

```
prebuild -t 0.26.6 -r node-webkit
```

See [`allTargets`](https://github.com/lgeiger/node-abi#usage) for all available versions.

For more options run `prebuild --help`. The prebuilds created are compatible with [node-pre-gyp](https://github.com/mapbox/node-pre-gyp)

If you'd like to include other files with your prebuilds like additional
`.node` files or other native libraries, you can pass a file-matching regular
expression to `--include-regex`:

```
prebuild -t 8.0.0 --include-regex "\.(node|a)$"
```

Note that if you include multiple `.node` files, you will need to use the
prebuild-install's `--binary-name` parameter to indicate which file should be
loaded:

```
prebuild-install --binary-name main-binary.node
```

The build file format is selected automatically by `node-gyp`, however it is possible to specify needed format explicitly with `--format` parameter.
This is particularly useful if unusual flavor is required, which could be specified in 'format-flavor' form
(there is no comprehensive list of formats/flavors available so one has to find possible combinations from `node-gyp` source code).
For example, in order to build using Makefiles but assume Android cross-compilation:

```
prebuild --format make-android
```

When using the [cmake-js](https://www.npmjs.com/package/cmake-js) backend additional parameters can be passed through.

```
prebuild --backend cmake-js -- --prefer-clang --CDUV_INCLUDE_DIR=...
```

## Scripts

A prepack script can be specified that is executed once the `.node` module has been created but before it is compressed and moved. This can be used to perform code signing.

```
prebuild --prepack 'codesign -v -s MyCompany'
```

The `--preinstall` or `--prepack` parameters can take either a shell command or JS file to be executed.

## Uploading

`prebuild` supports uploading prebuilds to GitHub releases. If the release doesn't exist, it will be created for you. To upload prebuilds simply add the `-u <github-token>` option:

```
$ prebuild --all -u <github-token>
```

If you don't want to use the token on cli you can put it in `~/.prebuildrc`:

```
upload=<github-token>
```

Note that `--upload` will only upload the targets that was built and stored in `./prebuilds`, so `prebuild -u <github-token> -t 4.3.0` will only upload the binary for the `4.3.0` target.

You can use `prebuild --upload-all` to upload all files from the `./prebuilds` folder.

## Create GitHub Token

A GitHub token is needed for two reasons:

* Create a GitHub release ([leveldown example](https://github.com/Level/leveldown/releases/tag/v1.4.4))
* Upload the prebuilt binaries to that release

To create a token:

* Go to [this page](https://github.com/settings/tokens)
* Click the `Generate new token` button
* Give the token a name and click the `Generate token` button, see below

![prebuild-token](https://cloud.githubusercontent.com/assets/13285808/20844584/d0b85268-b8c0-11e6-8b08-2b19522165a9.png)

The default scopes should be fine.

## Help

```
$ prebuild -h
prebuild [options]

  --target      -t  version     (version to build or install for)
  --runtime     -r  runtime     (Node runtime [node, electron or node-webkit] to build or install for, default is node)
  --all                         (prebuild for all known abi versions)
  --upload      -u  [gh-token]  (upload prebuilds to github)
  --upload-all  -u  [gh-token]  (upload all files from ./prebuilds folder to github)
  --preinstall  -i  script      (run this script before prebuilding)
  --prepack     -c  script      (run this script before packing, can be used to codesign)
  --path        -p  path        (make a prebuild here)
  --include-regex               (regex to match files that will be distributed [default: '\.node$'])
  --libc                        (use provided libc rather than system default)
  --backend                     (specify build backend, default is 'node-gyp')
  --format                      (specify additional parameters for `node-gyp` backend)
  --strip                       (strip debug information)
  --debug                       (set Debug or Release configuration)
  --verbose                     (log verbosely)
  --version                     (print prebuild version and exit)
```

## JavaScript API

```js
var prebuild = require('prebuild')
```

### .build(opts, version, cb)

Options:

- `.log` (optional)
- `.preinstall` (optional)
- `.gyp` Provide a custom `node-gyp` instance (optional)
- `.backend` Provide a custom `node-gyp` instance via string. Alternatives are `'node-gyp'`, `'node-ninja'`, `'nw-gyp'` and `'cmake-js'` (optional, defaults to `'node-gyp'`)
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

* Build `some-native-module` for all supported targets and store them in `./prebuilds/`
* Strip binaries from debug information
* Create a release on GitHub, if needed
* Upload all binaries to that release, if not already uploaded

Before you commit your changes and send us a pull request, do run `npm test`.

## License

MIT
