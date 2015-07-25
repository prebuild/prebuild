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

## License

MIT
