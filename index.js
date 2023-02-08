/**
 * @typedef {import('vfile').VFile} VFile
 * @typedef {string|Assert|Array<string|Assert>} Test
 *
 * @typedef State
 * @property {Array<string>} checked
 * @property {Assert} test
 * @property {boolean} [broken]
 *
 * @callback Assert
 * @param {VFile} file
 * @param {fs.Stats} stats
 * @returns {number|boolean|void}
 *
 * @callback Callback
 * @param {Error|null} error
 * @param {Array<VFile>} files
 * @returns {void}
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {toVFile} from 'to-vfile'

export const INCLUDE = 1
export const SKIP = 4
export const BREAK = 8

export const findDown =
  /**
   * @type {{
   *   (test: Test, paths: string|Array<string>, callback: Callback): void
   *   (test: Test, callback: Callback): void
   *   (test: Test, paths?: string|Array<string>): Promise<Array<VFile>>
   * }}
   */
  (
    /**
     * Find files or directories downwards.
     *
     * @param {Test} test
     * @param {string|Array<string>} paths
     * @param {Callback} callback
     * @returns {unknown}
     */
    function (test, paths, callback) {
      // @ts-expect-error: To do: fix `callback` and `one`.
      return find(test, paths, callback)
    }
  )

export const findDownOne =
  /**
   * @type {{
   *   (test: Test, paths: string|Array<string>, callback: Callback): void
   *   (test: Test, callback: Callback): void
   *   (test: Test, paths?: string|Array<string>): Promise<VFile>
   * }}
   */
  (
    /**
     * Find a file or a directory downwards.
     *
     * @param {Test} test
     * @param {string|Array<string>} paths
     * @param {Callback} callback
     * @returns {unknown}
     */
    function (test, paths, callback) {
      // @ts-expect-error: To do: fix `callback` and `one`.
      return find(test, paths, callback, true)
    }
  )

/**
 * Find applicable files.
 *
 * @param {Test} test
 * @param {string|Array<string>|((error: Error|null, result?: VFile|Array<VFile>) => void)} cwds
 * @param {null|undefined|((error: Error|null, result?: VFile|Array<VFile>) => void)} cb
 * @param {boolean} [one]
 * @returns {Promise<VFile|Array<VFile>> | undefined}
 */
function find(test, cwds, cb, one) {
  const state = {checked: [], test: convert(test)}
  /** @type {Array<string>} */
  let paths
  /** @type {((error: Error|null, result?: VFile|Array<VFile>) => void) | null | undefined} */
  let callback

  if (typeof cwds === 'string') {
    paths = [cwds]
    callback = cb
  } else if (Array.isArray(cwds)) {
    paths = cwds
    callback = cb
  } else {
    paths = [process.cwd()]
    callback = cwds
  }

  if (!callback) return new Promise(executor)

  executor(resolve)

  /**
   * @param {VFile|Array<VFile>} result
   */
  function resolve(result) {
    // @ts-expect-error: `callback` is defined if we’re here.
    callback(null, result)
  }

  /**
   * @param {(x: VFile|Array<VFile>) => void} resolve
   */
  function executor(resolve) {
    visitAll(state, paths, null, one, done)

    /**
     * @param {Array<VFile>} result
     */
    function done(result) {
      resolve(one ? result[0] || null : result)
    }
  }
}

/**
 * Find files in `filePath`.
 *
 * @param {State} state
 * @param {string} filePath
 * @param {boolean | undefined} one
 * @param {Function} done
 */
function visit(state, filePath, one, done) {
  // Don’t walk into places multiple times.
  if (state.checked.includes(filePath)) {
    done([])
    return
  }

  state.checked.push(filePath)

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
 * @param {Array<string>} paths
 * @param {string | null} cwd
 * @param {boolean | undefined} one
 * @param {Function} done
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
    if (test === file.basename || test === file.extname) {
      return INCLUDE
    }

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
 * @param {Array<string|Assert>} test
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
