# vfile-find-down

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

Find [vfile][]s by searching the file system downwards.

## Install

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c):
Node 12+ is needed to use it and it must be `import`ed instead of `require`d.

[npm][]:

```sh
npm install vfile-find-down
```

## Use

```js
var findDown = require('vfile-find-down')

findDown('.md', console.log)
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

This package exports the following identifiers: `findDown`, `findDownOne`,
`INCLUDE`, `SKIP`, `BREAK`.
There is no default export.

### `findDown(tests[, paths][, callback])`

Search for `tests` downwards.
Calls callback with either an error or an array of files passing `tests`.
Note: Virtual Files are not read (their `contents` is not populated).

##### Signatures

*   `(tests: Tests, paths?: string|Array.<string>, callback: Callback): void`
*   `(tests: Tests, paths?: string|Array.<string>): Promise.<Array.<VFile>>`

##### Parameters

###### `tests`

Things to search for (`string|Function|Array.<Tests>`).

If an array is passed in, any test must match a given file for it to be
included.

If a `string` is passed in, the `basename` or `extname` of files must match it
for them to be included (and hidden directories and `node_modules` will not be
searched).

Otherwise, they must be [`function`][test].

###### `paths`

Place(s) to searching from (`Array.<string>` or `string`, default:
`process.cwd()`).

###### `callback`

Function called with all matching files (`function cb(err[, files])`).

### `findDownOne(tests[, paths][, callback])`

Like `findDown`, but either calls `callback` with the first found file or
`null`, or returns a promise that resolved to a file or `null`.

### `function test(file, stats)`

Check whether a virtual file should be included.
Called with a [vfile][] and a [stats][] object.

###### Returns

*   `true` or `INCLUDE` — Include the file in the results
*   `SKIP` — Do not search inside this directory
*   `BREAK` — Stop searching for files
*   anything else is ignored: files are neither included nor skipped

The different flags can be combined by using the pipe operator:
`INCLUDE | SKIP`.

## Contribute

See [`contributing.md`][contributing] in [`vfile/.github`][health] for ways to
get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/vfile/vfile-find-down/workflows/main/badge.svg

[build]: https://github.com/vfile/vfile-find-down/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/vfile/vfile-find-down.svg

[coverage]: https://codecov.io/github/vfile/vfile-find-down

[downloads-badge]: https://img.shields.io/npm/dm/vfile-find-down.svg

[downloads]: https://www.npmjs.com/package/vfile-find-down

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/vfile/vfile/discussions

[npm]: https://docs.npmjs.com/cli/install

[contributing]: https://github.com/vfile/.github/blob/HEAD/contributing.md

[support]: https://github.com/vfile/.github/blob/HEAD/support.md

[health]: https://github.com/vfile/.github

[coc]: https://github.com/vfile/.github/blob/HEAD/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[vfile]: https://github.com/vfile/vfile

[stats]: https://nodejs.org/api/fs.html#fs_class_fs_stats

[test]: #function-testfile-stats
