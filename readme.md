# vfile-find-down [![Build Status][travis-badge]][travis] [![Coverage Status][codecov-badge]][codecov]

Find [vfile][]s by searching the file system downwards.

## Installation

[npm][]:

```bash
npm install vfile-find-down
```

## Usage

```js
var findDown = require('vfile-find-down');

findDown.all('.md', console.log);
```

Yields:

```js
null [ VFile {
  data: {},
  messages: [],
  history: [ '/Users/tilde/projects/oss/vfile-find-down/readme.md' ],
  cwd: '/Users/tilde/projects/oss/vfile-find-down' } ]
```

## API

### `findDown.all(tests[, paths], callback)`

Search for `tests` downwards.  Invokes callback with either an error
or an array of files passing `tests`.
Note: Virtual Files are not read (their `contents` is not populated).

##### Parameters

###### `tests`

Things to search for (`string|Function|Array.<tests>`).

If an array is passed in, any test must match a given file for it
to be included.

If a `string` is passed in, the `basename` or `extname` of files
must match it for them to be included (and hidden directories and
`node_modules` will not be searched).

Otherwise, they must be [`function`][test].

###### `paths`

Place(s) to searching from (`Array.<string>` or `string`, default:
`process.cwd()`).

###### `callback`

Function invoked with all matching files (`function cb(err[, files])`).

### `findDown.one(tests[, paths], callback)`

Like `findDown.all`, but invokes `callback` with the first found
file, or `null`.

### `function test(file, stats)`

Check whether a virtual file should be included.  Invoked with
a [vfile][] and a [stats][] object.

###### Returns

*   `true` or `findDown.INCLUDE` — Include the file in the results;
*   `findDown.SKIP` — Do not search inside this directory;
*   `findDown.BREAK` — Stop searching for files;
*   anything else is ignored: files are neither included nor skipped.

The different flags can be combined by using the pipe operator:
`findDown.INCLUDE | findDown.SKIP`.

## License

[MIT][] © [Titus Wormer][author]

<!-- Definitions -->

[travis-badge]: https://img.shields.io/travis/vfile/vfile-find-down.svg

[travis]: https://travis-ci.org/vfile/vfile-find-down

[codecov-badge]: https://img.shields.io/codecov/c/github/vfile/vfile-find-down.svg

[codecov]: https://codecov.io/github/vfile/vfile-find-down

[npm]: https://docs.npmjs.com/cli/install

[mit]: LICENSE

[author]: http://wooorm.com

[vfile]: https://github.com/vfile/vfile

[stats]: https://nodejs.org/api/fs.html#fs_class_fs_stats

[test]: #function-testfile-stats
