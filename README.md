# prebuild

A command line tool for easily doing prebuilds for multiple version of node/iojs on a specific platform

```
npm install -g prebuild
```

## Usage

```
cd a-native-module
# create prebuilds for iojs v2.4.0 and node 0.12.7 and write them to ./prebuilds/
prebuild -t v2.4.0 -t 0.12.7
```

For more options run `prebuild --help`

## ABI

You just need to do a prebuild for every version of node/iojs that have new ABI (application binary interface).
As of writing this to support all versions of node (>0.8.0) and iojs do

```
prebuild -t 0.10.26 -t 0.12.7 -t 1.8.1 -t 1.0.1 -t 2.4.0
```

Optionally you can add a rc file to `~/.prebuildrc` with the following content

``` ini
target[] = 0.10.26
target[] = 0.12.7
target[] = 1.8.1
target[] = 1.0.1
target[] = 2.4.0
```

To always build for the above versions

## License

MIT
