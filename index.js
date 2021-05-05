import fs from 'fs'
import path from 'path'
import {toVFile} from 'to-vfile'

export const INCLUDE = 1
export const SKIP = 4
export const BREAK = 8

// Find files or directories downwards.
export function findDown(test, paths, callback) {
  return find(test, paths, callback)
}

// Find a file or a directory downwards.
export function findDownOne(test, paths, callback) {
  return find(test, paths, callback, true)
}

// Find applicable files.
function find(test, paths, callback, one) {
  var state = {checked: [], test: augment(test)}

  if (!callback) {
    callback = paths
    paths = process.cwd()
  }

  if (typeof paths === 'string') {
    paths = [paths]
  }

  if (!callback) return new Promise(executor)

  executor(resolve)

  function resolve(result) {
    callback(null, result)
  }

  function executor(resolve) {
    visitAll(state, paths, null, one, done)

    function done(result) {
      resolve(one ? result[0] || null : result)
    }
  }
}

// Find files in `filePath`.
function visit(state, filePath, one, done) {
  // Don’t walk into places multiple times.
  if (state.checked.includes(filePath)) {
    done([])
    return
  }

  state.checked.push(filePath)
  fs.stat(path.resolve(filePath), onstat)

  function onstat(error, stats) {
    var real = Boolean(stats)
    var results = []
    var file
    var result

    if (state.broken || !real) {
      done([])
    } else {
      file = toVFile(filePath)
      result = state.test(file, stats)

      if ((result & 1) === 1 /* Include. */) {
        results.push(file)

        if (one) {
          state.broken = true
          return done(results)
        }
      }

      if ((result & 8) === 8 /* Break. */) {
        state.broken = true
      }

      if (
        state.broken ||
        !stats.isDirectory() ||
        (result & 4) === 4 /* Skip. */
      ) {
        return done(results)
      }

      fs.readdir(filePath, onread)
    }

    function onread(error, entries) {
      visitAll(state, entries, filePath, one, onvisit)
    }

    function onvisit(files) {
      done(results.concat(files))
    }
  }
}

// Find files in `paths`.
// eslint-disable-next-line max-params
function visitAll(state, paths, cwd, one, done) {
  var actual = -1
  var expected = -1
  var result = []

  while (++expected < paths.length) {
    visit(state, path.join(cwd || '', paths[expected]), one, onvisit)
  }

  next()

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

// Augment `test` from several supported values to a function returning a
// boolean.
function augment(test) {
  return typeof test === 'function'
    ? test
    : typeof test === 'string'
    ? testString(test)
    : multiple(test)
}

// Wrap a string given as a test.
function testString(test) {
  return check

  // Check whether the given `file` matches the bound value.
  function check(file) {
    if (test === file.basename || test === file.extname) {
      return true
    }

    if (file.basename.charAt(0) === '.' || file.basename === 'node_modules') {
      return 4
    }
  }
}

function multiple(test) {
  var tests = []
  var index = -1

  while (++index < test.length) {
    tests[index] = augment(test[index])
  }

  return check

  function check(file) {
    var index = -1
    var result

    while (++index < tests.length) {
      result = tests[index](file)

      if (result) {
        return result
      }
    }

    return false
  }
}
