# prebuild

A command line tool for easily doing prebuilds for multiple version of node/iojs on a specific platform

```
$ npm install -g prebuild
```

[![build status](http://img.shields.io/travis/mafintosh/prebuild.svg?style=flat)](http://travis-ci.org/mafintosh/prebuild)

## Features

* Builds native modules for any version of node/iojs, without having to switch between different versions of node/iojs to do so. This works by only downloading the correct headers and telling `node-gyp` to use those instead of the ones installed on your system.
* Installs (`--install`) prebuilt binaries from GitHub by default or from a host of your choice. The url format can be customized as you see fit.
* Upload (`--upload`) prebuilt binaries to GitHub.
* Installed binaries are cached in `~/.npm/_prebuilds/` so you only need to download them once.
* Support for stripping (`--strip`) debug information.

## Building

Create prebuilds for iojs `v2.4.0` and node `0.12.7` (`v` prefix is optional) and write them to `./prebuilds/`

```
$ cd a-native-module
$ prebuild -t v2.4.0 -t 0.12.7
```

For more options run `prebuild --help`. The prebuilds created are compatible with [node-pre-gyp](https://github.com/mapbox/node-pre-gyp)

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
    "prebuild": "^2.7.2"
  }
}
```

If you are hosting your binaries elsewhere you can provide a host to the `--install` flag. The host string can also be a template for constructing more intrinsic urls. Install from `example.com` with a custom format for the binary name:

```
$ prebuild --install https://example.com/{name}-{version}-{abi}-{platform}-{arch}.tar.gz
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
* `{configuration}`: `'Debug'` if `--debug` is specified, otherwise `'Release'`
* `{module_name}`: taken from `binary.module_name` property from `package.json`

## ABI

You just need to do a prebuild for every version of node/iojs that have new ABI (application binary interface).

As of writing the following command will prebuild all possible ABI versions for iojs and for all node versions greater than `0.8`:

```
prebuild -t 0.10.40 -t 0.12.7 -t 1.0.4 -t 1.8.4 -t 2.4.0
```

Optionally, to always build for the above versions you can add a rc file to `~/.prebuildrc` with the following content. Note that using `~/.prebuildrc` will instruct prebuild to do this for *all* modules. Instead you should consider adding a `.prebuildrc` inside your project, so the module determines which version it supports rather than a global setting.

``` ini
target[] = 0.10.40
target[] = 0.12.7
target[] = 1.0.4
target[] = 1.8.4
target[] = 2.4.0
```

Another option is to use `--all` to build for *all* known abi versions (see [`targets.js`](https://github.com/mafintosh/prebuild/blob/master/targets.js) for currently available versions)

```
$ prebuild --all
```

## Uploading

`prebuild` supports uploading prebuilds to GitHub releases. If the release doesn't exist, it will be created for you. To upload prebuilds simply add the `--upload <github-token>` option:

```
$ prebuild -t v2.4.0 -t 0.12.7 -u <github-token>
```

If you don't want to use the token on cli you can also stick that in e.g. `~/.prebuildrc`:

```json
{
  "upload": "<github-token>"
}
```

Note that `--upload` will only upload the targets that was built and stored in `./prebuilds`, so `prebuild --upload <token> -t 2.4.0` will only upload the binary for the `2.4.0` target.

You can use `prebuild --upload-all` to upload all files from the `./prebuilds` folder.

See [this page](https://github.com/settings/tokens) for more information on how to create GitHub tokens.

## Help

```
$ prebuild -h
prebuild [options]

  --path        -p  path        (make a prebuild here)
  --target      -t  version     (version to prebuild against)
  --all                         (prebuild for all known abi versions)
  --install                     (download when using npm, compile otherwise)
  --download    -d  [url]       (download prebuilds, no url means github)
  --upload      -u  [gh-token]  (upload prebuilds to github)
  --upload-all  -u  [gh-token]  (upload all files from ./prebuilds folder to github)
  --preinstall  -i  script      (run this script before prebuilding)
  --compile     -c              (compile your project using node-gyp)
  --no-compile                  (skip compile fallback when downloading)
  --strip                       (strip debug information)
  --debug                       (set Debug or Release configuration)
  --verbose                     (log verbosely)
  --version                     (print prebuild version and exit)
```

## License

MIT
