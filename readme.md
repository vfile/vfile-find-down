# vfile-find-down

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[vfile][] utility to find files by searching the file system downwards.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`findDown(tests[, paths][, callback])`](#finddowntests-paths-callback)
    *   [`findDownOne(tests[, paths][, callback])`](#finddownonetests-paths-callback)
    *   [`function assert(file, stats)`](#function-assertfile-stats)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This utility lets you find one or many files downwards.

## When should I use this?

You can use this utility if you want to find files in, say, a folder.
One example is all markdown files.
If you instead want to find files upwards, such as config files, you can use
[`vfile-find-up`][vfile-find-up].

## Install

This package is [ESM only][esm].
In Node.js (version 12.20+, 14.14+, 16.0+, or 18.0+), install with [npm][]:

```sh
npm install vfile-find-down
```

## Use

```js
import {findDown} from 'vfile-find-down'

console.log(await findDown('.md'))
```

Yields:

```js
[ VFile {
  data: {},
  messages: [],
  history: [ '/Users/tilde/projects/oss/vfile-find-down/readme.md' ],
  cwd: '/Users/tilde/projects/oss/vfile-find-down' } ]
```

## API

This package exports the identifiers `findDown`, `findDownOne`, `INCLUDE`,
`SKIP`, and `BREAK`.
There is no default export.

### `findDown(tests[, paths][, callback])`

Search for `tests` downwards.
Calls callback with either an error or an array of files passing `tests`, or
returns them as a promise if no `callback` is passed.

> 👉 **Note**: files are not read (their `value` is not populated).

##### Signatures

*   `(tests: Tests, paths?: string|Array<string>, callback: Callback): void`
*   `(tests: Tests, paths?: string|Array<string>): Promise<Array<VFile>>`

##### Parameters

###### `tests`

Things to search for (`string|Function|Array<Tests>`).

If an array is passed in, any test must match a given file for it to be
included.

If a `string` is passed in, the `basename` or `extname` of files must match it
for them to be included (and hidden directories and `node_modules` will not be
searched).

Otherwise, they must be [`Assert`][assert].

###### `paths`

Place or places to search from (`Array<string>` or `string`, default:
`process.cwd()`).

###### `callback`

Function called with all matching files (`function cb(error[, files])`).

### `findDownOne(tests[, paths][, callback])`

Like `findDown`, but either calls `callback` with the first found file or
`null`, or returns a promise that resolved to a file or `null`.

### `function assert(file, stats)`

Check whether a file should be included.
Called with a [vfile][] and a [stats][] object.

###### Returns

*   `true` or `INCLUDE` — include the file in the results
*   `SKIP` — do not search inside this directory
*   `BREAK` — stop searching for files
*   anything else is ignored: files are neither included nor skipped

The different flags can be combined by using the pipe operator:
`INCLUDE | SKIP`.

## Types

This package is fully typed with [TypeScript][].
It exports the additional types `Assert` and `Test`.

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 12.20+, 14.14+, 16.0+, and 18.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

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

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[typescript]: https://www.typescriptlang.org

[contributing]: https://github.com/vfile/.github/blob/main/contributing.md

[support]: https://github.com/vfile/.github/blob/main/support.md

[health]: https://github.com/vfile/.github

[coc]: https://github.com/vfile/.github/blob/main/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[vfile]: https://github.com/vfile/vfile

[vfile-find-up]: https://github.com/vfile/vfile-find-up

[stats]: https://nodejs.org/api/fs.html#fs_class_fs_stats

[assert]: #function-assertfile-stats
