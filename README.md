# prebuild

A command line tool for easily doing prebuilds for multiple versions of [Node.js](https://nodejs.org/en/), [io.js](https://iojs.org/en/) and [Electron](http://electron.atom.io/) on a specific platform.

```
$ npm install -g prebuild
```

[![build status](http://img.shields.io/travis/mafintosh/prebuild.svg?style=flat)](http://travis-ci.org/mafintosh/prebuild) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

## Features

* Builds native modules for any version of Node.js, io.js or Electron, without having to switch between different versions to do so. This works by only downloading the correct headers and telling `node-gyp` to use those instead of the ones installed on your system.
* Upload (`--upload`) prebuilt binaries to GitHub.
* Support for stripping (`--strip`) debug information.
* Install prebuilt modules via [`prebuild-install`](https://github.com/mafintosh/prebuild-install).

## Building

Building is only required for targets with different [ABI](https://en.wikipedia.org/wiki/Application_binary_interface) versions. To build for all *supported* ABI versions greater than `0.8` ([example from leveldown](https://github.com/Level/leveldown/blob/ea5999dbd5fddf8f811b6c14162a3282b24ef7a9/package.json#L55)):

```
prebuild --all
```

Alternatively, to build for some specific versions you can do:

```
prebuild -t 0.10.42 -t 0.12.10 -t 4.3.0
```

To build against Electron headers, do:

```
prebuild -t 1.4.10 -r electron
```

See [`allTargets`](https://github.com/lgeiger/node-abi#usage) for all available versions.

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
  --runtime     -r  runtime     (Node runtime [node or electron] to build or install for, default is node)
  --all                         (prebuild for all known abi versions)
  --upload      -u  [gh-token]  (upload prebuilds to github)
  --upload-all  -u  [gh-token]  (upload all files from ./prebuilds folder to github)
  --preinstall  -i  script      (run this script before prebuilding)
  --path        -p  path        (make a prebuild here)
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

* Build `some-native-module` for all supported targets and store them in `./prebuilds/`
* Strip binaries from debug information
* Create a release on GitHub, if needed
* Upload all binaries to that release, if not already uploaded

Before you commit your changes and send us a pull request, do run `npm test`.

## License

MIT
