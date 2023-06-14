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
    *   [`findDown(test[, paths][, callback])`](#finddowntest-paths-callback)
    *   [`findDownAll(test[, paths][, callback])`](#finddownalltest-paths-callback)
    *   [`BREAK`](#break)
    *   [`INCLUDE`](#include)
    *   [`SKIP`](#skip)
    *   [`Assert`](#assert)
    *   [`Callback`](#callback)
    *   [`CallbackAll`](#callbackall)
    *   [`Test`](#test)
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
In Node.js (version 14.14+ and 16.0+), install with [npm][]:

```sh
npm install vfile-find-down
```

## Use

```js
import {findDownAll} from 'vfile-find-down'

console.log(await findDownAll('.md'))
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

This package exports the identifiers
[`BREAK`][api-break],
[`INCLUDE`][api-include],
[`SKIP`][api-skip],
[`findDown`][api-find-down], and
[`findDownAll`][api-find-down-all].
There is no default export.

### `findDown(test[, paths][, callback])`

Find the first file or folder downwards.

> 👉 **Note**: files are not read (their `value` is not populated).

###### Signatures

*   `(test[, paths], callback) => undefined`
*   `(test[, paths]) => Promise<VFile>`

###### Parameters

*   `test` ([`Test`][api-test])
    — things to search for
*   `paths` (`Array<string> | string`, default: `process.cwd()`)
    — places to search from
*   `callback` ([`Callback`][api-callback], optional)
    — callback called when done

###### Returns

Nothing when `callback` is given (`void`), otherwise a promise that resolves to
a file ([`VFile`][vfile] or `undefined`).

### `findDownAll(test[, paths][, callback])`

Find files or folders downwards.

> 👉 **Note**: files are not read (their `value` is not populated).

###### Signatures

*   `(test[, paths], callback) => undefined`
*   `(test[, paths]) => Promise<Array<VFile>>`

###### Parameters

*   `test` ([`Test`][api-test])
    — things to search for
*   `paths` (`Array<string> | string`, default: `process.cwd()`)
    — places to search from
*   `callback` ([`CallbackAll`][api-callback-all], optional)
    — callback called when done

###### Returns

Nothing when `callback` is given (`undefined`), otherwise a promise that
resolves to files ([`Array<VFile>`][vfile]).

### `BREAK`

Stop searching (`number`).

### `INCLUDE`

Include this file (`number`).

### `SKIP`

Skip this folder (`number`).

### `Assert`

Handle a file (TypeScript type).

###### Parameters

*   `file` ([`VFile`][vfile])
    — file to handle
*   `stats` ([`Stats`][stats])
    — stats from `fs.stat`

###### Returns

How to handle this file (`boolean | number`, optional).

Booleans are treated as `INCLUDE` (when `true`) or `SKIP` (when `false`).
No result is treated as `SKIP`.
The different flags can be combined by using the pipe operator:
`INCLUDE | SKIP`.

### `Callback`

Callback called when done finding one file (TypeScript type).

###### Parameters

*   `error` (`Error` or `undefined`)
    — error; errors are currently never passed
*   `file` ([`VFile`][vfile] or `undefined`)
    — file

###### Returns

Nothing (`undefined`).

### `CallbackAll`

Callback called when done (TypeScript type).

###### Parameters

*   `error` (`Error` or `undefined`)
    — error; errors are currently never passed
*   `files` ([`Array<VFile>`][vfile])
    — files

###### Returns

Nothing (`void`).

### `Test`

Things to search for (TypeScript type).

For strings, the `basename` or `extname` of files must match them and
hidden folders and `node_modules` will not be searched.
For arrays, any test in them must match.

###### Type

```ts
type Test = Array<Assert | string> | Assert | string
```

## Types

This package is fully typed with [TypeScript][].
It exports the additional types
[`Assert`][api-assert],
[`Callback`][api-callback],
[`CallbackAll`][api-callback-all], and
[`Test`][api-test].

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 14.14+ and 16.0+.
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

[api-break]: #break

[api-include]: #include

[api-skip]: #skip

[api-find-down-all]: #finddownalltest-paths-callback

[api-find-down]: #finddowntest-paths-callback

[api-assert]: #assert

[api-callback]: #callback

[api-callback-all]: #callbackall

[api-test]: #test
