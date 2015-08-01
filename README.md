# prebuild

A command line tool for easily doing prebuilds for multiple version of node/iojs on a specific platform

```
$ npm install -g prebuild
```

[![build status](http://img.shields.io/travis/mafintosh/prebuild.svg?style=flat)](http://travis-ci.org/mafintosh/prebuild)

## Features

* Builds native modules for any version of node/iojs, without having to switch between different versions of node/iojs to do so. This works by only downloading the correct headers and telling `node-gyp` to use those instead of the ones installed on your system.
* Support for uploading (`--upload`) prebuilds to GitHub.
* Support for downloading (`--download`) prebuilds from GitHub. You can also download from a host of your choice and you can customize the url format as you see fit.

## Building

Create prebuilds for iojs `v2.4.0` and node `0.12.7` and write them to `./prebuilds/`

```
$ cd a-native-module
$ prebuild -t v2.4.0 -t 0.12.7
```

For more options run `prebuild --help`. The prebuilds created are compatible with [node-pre-gyp](https://github.com/mapbox/node-pre-gyp)

## Uploading

`prebuild` supports uploading prebuilds to Github releases. If the release doesn't exist, it will be created for you. To upload prebuilds simply add the `--upload [github-token]` option

```
$ prebuild -t v2.4.0 -t 0.12.7 -u put-your-github-personal-token-here
```

If you don't want to use the token on cli you can also stick that in e.g. `~/.prebuildrc`:

```json
{
  "upload": "<github-token>"
}
```

## Downloading

`prebuild` supports downloading prebuilds from GitHub by default. To download a prebuild for your specific platform simply use the `--download` flag.

```
$ prebuild --download
```

If no suitable binary is found for the current platform / node version `prebuild`
will simply fallback to run `node-gyp rebuild`.

Once a binary has been downloaded `prebuild` will `require()` the module and if that fails it will also fallback to building it.

The downloaded binaries will be cached in your npm cache meaning you'll only have to download them once.

Add `prebuild --download` to your `package.json` so the binaries will be downloaded when the module is installed

```json
{
  "name": "a-native-module",
  "scripts": {
    "install": "prebuild --download"
  },
  "dependencies": {
    "prebuild": "^2.3.0"
  }
}
```

If you are hosting your binaries elsewhere you can provide a host to the `--download` flag. The host string can also be a template for constructing more intrinsic urls. Download from `example.com` with a custom format for the binary name:

```
$ prebuild --download https://foo.com/{name}-{version}-{abi}-{platform}-{arch}.tar.gz
```

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

## License

MIT
