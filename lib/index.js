/**
 * @typedef {import('vfile').VFile} VFile
 */

/**
 * @callback Assert
 *   Handle a file.
 * @param {VFile} file
 *   File to handle.
 * @param {fs.Stats} stats
 *   Stats from `fs.stat`.
 * @returns {boolean | null | number | undefined | void}
 *   How to handle this file.
 *
 *   Booleans are treated as `INCLUDE` (when `true`) or `SKIP` (when `false`).
 *   No result is treated as `SKIP`.
 *   The different flags can be combined by using the pipe operator:
 *   `INCLUDE | SKIP`.
 *
 * @callback Callback
 *   Callback called when done.
 * @param {Error | null} error
 *   Error.
 *
 *   > 👉 **Note**: Errors are currently never passed.
 * @param {Array<VFile>} files
 *   Files.
 * @returns {void}
 *   Nothing.
 *
 * @callback CallbackOne
 *   Callback called when done finding one file.
 * @param {Error | null} error
 *   Error.
 *
 *   > 👉 **Note**: Errors are currently never passed
 * @param {VFile | null} file
 *   File.
 * @returns {void}
 *   Nothing.
 *
 * @typedef {Array<Assert | string> | Assert | string} Test
 *   Things to search for.
 *
 *   For strings, the `basename` or `extname` of files must match them and
 *   hidden folders and `node_modules` will not be searched.
 *   For arrays, any test in them must match.
 *
 * @typedef State
 *   State.
 * @property {Set<string>} checked
 *   Files that have been checked already.
 * @property {Assert} test
 *   File test.
 * @property {boolean} broken
 *   Whether we stopped searching.
 */

// Note: using callback style is likely faster here as we could walk into tons
// of folders.
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {toVFile} from 'to-vfile'

// To do: use `URL`?
// To do: next major: rename to `findDownAll`?

/**
 * Include this file.
 */
export const INCLUDE = 1

/**
 * Skip this folder.
 */
export const SKIP = 4

/**
 * Stop searching.
 */
export const BREAK = 8

/**
 * Find files or folders downwards.
 *
 * > 👉 **Note**: files are not read (their `value` is not populated).
 *
 * @param test
 *   Things to search for.
 * @param paths
 *   Places to search from.
 * @param callback
 *   Callback called when done.
 * @returns
 *   Nothing when `callback` is given, otherwise a promise that resolves to
 *   files.
 */
export const findDown =
  /**
   * @type {(
   *   ((test: Test, paths: Array<string> | string | null | undefined, callback: Callback) => void) &
   *   ((test: Test, callback: Callback) => void) &
   *   ((test: Test, paths?: Array<string> | null | undefined) => Promise<Array<VFile>>)
   * )}
   */
  (
    /**
     * @param {Test} test
     * @param {Array<string> | Callback | string | null | undefined} [paths]
     * @param {Callback | null | undefined} [callback]
     * @returns {Promise<Array<VFile>> | undefined}
     */
    function (test, paths, callback) {
      /** @type {Callback | null | undefined} */
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

      promise.then(
        // @ts-expect-error: `callbackAll` is defined.
        (files) => callbackAll(null, files),
        callbackAll
      )
    }
  )

/**
 * Find the first file or folder downwards.
 *
 * > 👉 **Note**: files are not read (their `value` is not populated).
 *
 * @param test
 *   Things to search for.
 * @param paths
 *   Places to search from.
 * @param callback
 *   Callback called when done.
 * @returns
 *   Nothing when `callback` is given, otherwise a promise that resolves to
 *   a file or `null`.
 */
export const findDownOne =
  /**
   * @type {(
   *   ((test: Test, paths: Array<string> | string | null | undefined, callback: CallbackOne) => void) &
   *   ((test: Test, callback: CallbackOne) => void) &
   *   ((test: Test, paths?: Array<string> | null | undefined) => Promise<VFile | null>)
   * )}
   */
  (
    /**
     * @param {Test} test
     * @param {Array<string> | CallbackOne | string | null | undefined} [paths]
     * @param {CallbackOne | null | undefined} [callback]
     * @returns {Promise<VFile | null> | undefined}
     */
    function (test, paths, callback) {
      /** @type {CallbackOne | null | undefined} */
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
        return promise.then(one)
      }

      promise.then(
        // @ts-expect-error: `callbackOne` is defined.
        (files) => callbackOne(null, one(files)),
        callbackOne
      )
    }
  )

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
  const state = {checked: new Set(), test: convert(test), broken: false}
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
    visitAll(state, cleanPaths, undefined, one, resolve)
  })
}

/**
 * Find files in `filePath`.
 *
 * @param {State} state
 *   Info passed around.
 * @param {string} filePath
 *   Base.
 * @param {boolean} one
 *   Stop at one file.
 * @param {(files: Array<VFile>) => void} done
 *   Callback called when done.
 */
function visit(state, filePath, one, done) {
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
      const file = toVFile(filePath)
      const result = Number(state.test(file, stats))

      if ((result & INCLUDE) === INCLUDE /* Include. */) {
        results.push(file)

        if (one) {
          state.broken = true
          return done(results)
        }
      }

      if ((result & BREAK) === BREAK /* Break. */) {
        state.broken = true
      }

      if (
        state.broken ||
        !stats.isDirectory() ||
        (result & SKIP) === SKIP /* Skip. */
      ) {
        return done(results)
      }

      fs.readdir(filePath, function (_, entries) {
        visitAll(state, entries, filePath, one, onvisit)
      })
    }

    /**
     * @param {Array<VFile>} files
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
 * @param {boolean} one
 *   Stop at one file.
 * @param {(files: Array<VFile>) => void} done
 *   Callback called when done.
 */
// eslint-disable-next-line max-params
function visitAll(state, paths, cwd, one, done) {
  let actual = -1
  let expected = -1
  /** @type {Array<VFile>} */
  const result = []

  while (++expected < paths.length) {
    visit(state, path.join(cwd || '', paths[expected]), one, onvisit)
  }

  next()

  /**
   * @param {Array<VFile>} files
   */
  function onvisit(files) {
    result.push(...files)
    next()
  }

  function next() {
    if (++actual === expected) {
      done(result)
    }
  }
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
    ? testString(test)
    : multiple(test)
}

/**
 * Wrap a string given as a test.
 *
 * @param {string} test
 * @returns {Assert}
 */
function testString(test) {
  return check

  /**
   * Check whether the given `file` matches the bound value.
   *
   * @type {Assert}
   */
  function check(file) {
    // File matches the given value as the basename or extname.
    if (test === file.basename || test === file.extname) {
      return INCLUDE
    }

    // Ignore dotfiles and `node_modules` normally.
    if (
      file.basename &&
      (file.basename.charAt(0) === '.' || file.basename === 'node_modules')
    ) {
      return SKIP
    }
  }
}

/**
 * Check multiple tests.
 *
 * @param {Array<Assert | string>} test
 * @returns {Assert}
 */
function multiple(test) {
  /** @type {Array<Assert>} */
  const tests = []
  let index = -1

  while (++index < test.length) {
    tests[index] = convert(test[index])
  }

  return check

  /** @type {Assert} */
  function check(file, stats) {
    let index = -1

    while (++index < tests.length) {
      const result = tests[index](file, stats)

      if (result) {
        return result
      }
    }

    return false
  }
}

/**
 * @param {Array<VFile>} files
 * @returns {VFile | null}
 */
function one(files) {
  return files[0] || null
}
