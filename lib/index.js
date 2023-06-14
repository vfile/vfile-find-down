/**
 * @callback Assert
 *   Handle a file.
 * @param {VFile} file
 *   File to handle.
 * @param {fs.Stats} stats
 *   Stats from `fs.stat`.
 * @returns {Result | undefined}
 *   How to handle this file.
 *
 *   Booleans are treated as `INCLUDE` (when `true`) or `SKIP` (when `false`).
 *   No result is treated as `SKIP`.
 *   The different flags can be combined by using the pipe operator:
 *   `INCLUDE | SKIP`.
 *
 * @callback CallbackAll
 *   Callback called when done.
 * @param {Error | undefined} error
 *   Error.
 *
 *   > 👉 **Note**: Errors are currently never passed.
 * @param {Array<VFile> | undefined} [files]
 *   Files.
 * @returns {undefined}
 *   Nothing.
 *
 * @callback Callback
 *   Callback called when done finding one file.
 * @param {Error | undefined} error
 *   Error.
 *
 *   > 👉 **Note**: Errors are currently never passed
 * @param {VFile | undefined} [file]
 *   File.
 * @returns {undefined}
 *   Nothing.
 *
 * @typedef {Array<Assert | string> | Assert | string} Test
 *   Things to search for.
 *
 *   For strings, the `basename` or `extname` of files must match them and
 *   hidden folders and `node_modules` will not be searched.
 *   For arrays, any test in them must match.
 *
 * @typedef Result
 *   What to do when collecting a file or folder.
 * @property {boolean | null | undefined} [break]
 *   Stop searching after this file or folder.
 * @property {boolean | null | undefined} [include]
 *   Include this file or folder.
 * @property {boolean | null | undefined} [skip]
 *   Do not search inside this folder.
 *
 * @typedef State
 *   State.
 * @property {boolean} broken
 *   Whether we stopped searching.
 * @property {Set<string>} checked
 *   Files that have been checked already.
 * @property {boolean} one
 *   Whether we’re looking for one file.
 * @property {Assert} test
 *   File test.
 */

// Note: using callback style is likely faster here as we could walk into tons
// of folders.
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {VFile} from 'vfile'

// To do: next next major: use `URL`s instead of paths?

/**
 * Find the first file or folder downwards.
 *
 * > 👉 **Note**: files are not read (their `value` is not populated).
 *
 * @overload
 * @param {Test} test
 * @param {Array<string> | string | null | undefined} paths
 * @param {Callback} callback
 * @returns {undefined}
 *
 * @overload
 * @param {Test} test
 * @param {Callback} callback
 * @returns {undefined}
 *
 * @overload
 * @param {Test} test
 * @param {Array<string> | string | null | undefined} [paths]
 * @returns {Promise<VFile | undefined>}
 *
 * @param {Test} test
 *   Things to search for.
 * @param {Array<string> | Callback | string | null | undefined} [paths]
 *   Places to search from.
 * @param {Callback | null | undefined} [callback]
 *   Callback called when done.
 * @returns {Promise<VFile | undefined> | undefined}
 *   Nothing when `callback` is given, otherwise a promise that resolves to
 *   a file or `undefined`.
 */
export function findDown(test, paths, callback) {
  /** @type {Callback | null | undefined} */
  let callbackOne
  /** @type {Promise<Array<VFile>>} */
  let promise

  if (typeof paths === 'function') {
    callbackOne = paths
    promise = find(test, undefined, true)
  } else {
    callbackOne = callback
    promise = find(test, paths || undefined, true)
  }

  if (!callbackOne) {
    return promise.then(pickFirst)
  }

  promise.then(function (files) {
    // @ts-expect-error: `callbackOne` is defined.
    callbackOne(undefined, pickFirst(files))
    return files
  }, callback)
}

/**
 * Find files or folders downwards.
 *
 * > 👉 **Note**: files are not read (their `value` is not populated).
 *
 * @overload
 * @param {Test} test
 * @param {Array<string> | string | null | undefined} paths
 * @param {CallbackAll} callback
 * @returns {undefined}
 *
 * @overload
 * @param {Test} test
 * @param {CallbackAll} callback
 * @returns {undefined}
 *
 * @overload
 * @param {Test} test
 * @param {Array<string> | string | null | undefined} [paths]
 * @returns {Promise<Array<VFile>>}
 *
 * @param {Test} test
 *   Things to search for.
 * @param {Array<string> | CallbackAll | string | null | undefined} [paths]
 *   Places to search from.
 * @param {CallbackAll | null | undefined} [callback]
 *   Callback called when done.
 * @returns {Promise<Array<VFile>> | undefined}
 *   Nothing when `callback` is given, otherwise a promise that resolves to
 *   files.
 */
export function findDownAll(test, paths, callback) {
  /** @type {CallbackAll | null | undefined} */
  let callbackAll
  /** @type {Promise<Array<VFile>>} */
  let promise

  if (typeof paths === 'function') {
    callbackAll = paths
    promise = find(test, undefined, false)
  } else {
    callbackAll = callback
    promise = find(test, paths || undefined, false)
  }

  if (!callbackAll) {
    return promise
  }

  promise.then(function (files) {
    // @ts-expect-error: `callbackAll` is defined.
    callbackAll(undefined, files)
    return files
  }, callbackAll)
}

/**
 * Convert `test`
 *
 * @param {Test} test
 * @returns {Assert}
 */
function convert(test) {
  return typeof test === 'function'
    ? test
    : typeof test === 'string'
    ? convertString(test)
    : convertTests(test)
}

/**
 * Convert a string test.
 *
 * @param {string} test
 * @returns {Assert}
 */
function convertString(test) {
  return assertString

  /**
   * Check whether the given `file` matches the bound value.
   *
   * @type {Assert}
   */
  function assertString(file) {
    // File matches the given value as the basename or extname.
    if (test === file.basename || test === file.extname) {
      return {include: true}
    }

    // Ignore dotfiles and `node_modules` normally.
    if (
      file.basename &&
      (file.basename.charAt(0) === '.' || file.basename === 'node_modules')
    ) {
      return {skip: true}
    }
  }
}

/**
 * Convert multiple tests.
 *
 * @param {Array<Assert | string>} test
 *   Tests.
 * @returns {Assert}
 *   Assertion.
 */
function convertTests(test) {
  /** @type {Array<Assert>} */
  const tests = []
  let index = -1

  while (++index < test.length) {
    tests[index] = convert(test[index])
  }

  return assert

  /** @type {Assert} */
  function assert(file, stats) {
    let index = -1

    while (++index < tests.length) {
      const result = tests[index](file, stats)

      if (result) {
        return result
      }
    }
  }
}

/**
 * Find files.
 *
 * @param {Test} test
 *   Things to search for.
 * @param {Array<string> | string | undefined} paths
 *   Places to search from.
 * @param {boolean} one
 *   Stop at one file.
 * @returns {Promise<Array<VFile>>}
 *   Promise that resolves to files.
 */
function find(test, paths, one) {
  /** @type {State} */
  const state = {broken: false, checked: new Set(), one, test: convert(test)}
  /** @type {Array<string>} */
  let cleanPaths

  if (typeof paths === 'string') {
    cleanPaths = [paths]
  } else if (Array.isArray(paths)) {
    cleanPaths = paths
  } else {
    cleanPaths = [process.cwd()]
  }

  return new Promise(function (resolve) {
    // @ts-expect-error: `resolve` is fine.
    visitAll(state, cleanPaths, undefined, resolve)
  })
}

/**
 * Get the first item.
 *
 * @template {unknown} T
 *   Kind.
 * @param {Array<T>} values
 *   List.
 * @returns {T | undefined}
 *   Head.
 */
function pickFirst(values) {
  return values[0]
}

/**
 * Find files in `filePath`.
 *
 * @param {State} state
 *   Info passed around.
 * @param {string} filePath
 *   Base.
 * @param {(files: Array<VFile>) => undefined} done
 *   Callback called when done.
 * @returns {undefined}
 *   Nothing.
 */
function visit(state, filePath, done) {
  // Don’t walk into places multiple times.
  if (state.checked.has(filePath)) {
    done([])
    return
  }

  state.checked.add(filePath)

  fs.stat(path.resolve(filePath), function (_, stats) {
    const real = Boolean(stats)
    /** @type {Array<VFile>} */
    const results = []

    if (state.broken || !real) {
      done([])
    } else {
      const file = new VFile({path: filePath})
      const result = state.test(file, stats)

      if (result && result.include) {
        results.push(file)

        if (state.one) {
          state.broken = true
          return done(results)
        }
      }

      if (result && result.break) {
        state.broken = true
      }

      if (state.broken || !stats.isDirectory() || (result && result.skip)) {
        return done(results)
      }

      fs.readdir(filePath, function (_, entries) {
        visitAll(state, entries, filePath, onvisit)
      })
    }

    /**
     * @param {Array<VFile>} files
     *   Files.
     * @returns {undefined}
     *   Nothing.
     */
    function onvisit(files) {
      done([...results, ...files])
    }
  })
}

/**
 * Find files in `paths`.
 *
 * @param {State} state
 *   Info passed around.
 * @param {Array<string>} paths
 *   Paths.
 * @param {string | undefined} cwd
 *   Base.
 * @param {(files: Array<VFile>) => undefined} done
 *   Callback called when done.
 * @returns {undefined}
 *   Nothing.
 */
function visitAll(state, paths, cwd, done) {
  let actual = -1
  let expected = -1
  /** @type {Array<VFile>} */
  const result = []

  while (++expected < paths.length) {
    visit(state, path.join(cwd || '', paths[expected]), onvisit)
  }

  next()

  /**
   * @param {Array<VFile>} files
   *   Files.
   * @returns {undefined}
   *   Nothing.
   */
  function onvisit(files) {
    result.push(...files)
    next()
  }

  /**
   * @returns {undefined}
   *   Nothing.
   */
  function next() {
    if (++actual === expected) {
      done(result)
    }
  }
}
