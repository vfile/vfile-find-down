/**
 * @typedef {import('vfile').VFile} VFile
 */

import test from 'tape'
import path from 'path'
import {findDown, findDownOne, INCLUDE, BREAK} from '../index.js'

var join = path.join
/**
 * @type {(...args: string[]) => string}
 */
var base = join.bind(null, process.cwd())

var tests = base('test')

test('findDownOne', function (t) {
  t.plan(17)

  findDownOne('package.json', function (_, file) {
    t.deepEqual(
      check(file),
      ['package.json'],
      '`directory` should default to CWD'
    )
  })

  findDownOne('package.json').then(function (file) {
    t.deepEqual(check(file), ['package.json'], 'should support promises')
  })

  findDownOne('foo.json', tests, function (_, file) {
    t.deepEqual(
      check(file),
      [join('test', 'fixture', 'foo.json')],
      'should search for a file'
    )
  })

  findDownOne('.json', tests, function (_, file) {
    t.deepEqual(
      check(file),
      [join('test', 'fixture', 'foo.json')],
      'should search for an extension'
    )
  })

  findDownOne(
    function (file) {
      return file.stem === 'quux'
    },
    tests,
    function (_, file) {
      t.deepEqual(
        check(file),
        [join('test', 'fixture', 'foo', 'bar', 'quux.md')],
        'should search with a function'
      )
    }
  )

  findDownOne('.test', tests, function (_, file) {
    t.deepEqual(
      check(file),
      [join('test', 'fixture', '.test')],
      'should search for a hidden file'
    )
  })

  findDownOne('.md', function (_, file) {
    t.deepEqual(
      check(file),
      ['readme.md'],
      'should search for the closest file'
    )
  })

  findDownOne(['.md', '.json'], tests, function (_, file) {
    var list = check(file)
    t.ok(list.length === 1, 'should search for multiple tests (1)')
    t.ok(
      list[0] === join('test', 'fixture', 'foo.json') ||
        list[0] === join('test', 'fixture', 'quuuux.md'),
      'should search for multiple tests (2)'
    )
  })

  findDownOne(
    '.md',
    [base('test', 'fixture', 'foo'), base('test', 'fixture', 'bar')],
    function (_, file) {
      var list = check(file)
      t.ok(list.length === 1, 'should search multiple directories (1)')
      t.ok(
        list[0] === join('test', 'fixture', 'foo', 'quuux.md') ||
          list[0] === join('test', 'fixture', 'bar', 'baaaz.md'),
        'should search multiple directories (2)'
      )
    }
  )

  findDownOne('!', tests, function (_, file) {
    t.equal(file, null, 'should pass `null` when not found #1')
  })

  findDownOne(['!', '?'], tests, function (_, file) {
    t.equal(file, null, 'should pass `null` when not found #2')
  })

  findDownOne(
    function (file) {
      if (file.stem === 'foo') {
        return INCLUDE
      }
    },
    tests,
    function (_, file) {
      var list = check(file)
      t.ok(list.length === 1)
      t.ok(
        list[0] === join('test', 'fixture', 'foo') ||
          list[0] === join('test', 'fixture', 'foo.json'),
        'should support `INCLUDE`'
      )
    }
  )

  findDownOne(
    function (file) {
      if (file.stem === 'foo') {
        return BREAK
      }
    },
    tests,
    function (_, file) {
      t.deepEqual(check(file), [null], 'should support `BREAK`')
    }
  )

  findDownOne('.md', 'missing', function (_, file) {
    t.deepEqual(check(file), [null], 'should ignore unfound files')
  })
})

test('findDown', function (t) {
  t.plan(13)

  findDown('package.json', function (_, files) {
    t.deepEqual(
      check(files),
      ['package.json'],
      '`directory` should default to CWD'
    )
  })

  findDown('package.json').then(function (files) {
    t.deepEqual(check(files), ['package.json'], 'should support promises')
  })

  findDown('foo.json', tests, function (_, files) {
    t.deepEqual(
      check(files),
      [join('test', 'fixture', 'foo.json')],
      'should return files by name and extension'
    )
  })

  findDown('.md', tests, function (_, files) {
    t.deepEqual(
      check(files).sort(),
      [
        join('test', 'fixture', 'bar', 'baaaz.md'),
        join('test', 'fixture', 'bar', 'foo', 'baaz.md'),
        join('test', 'fixture', 'bar', 'foo', 'bar', 'baz.md'),
        join('test', 'fixture', 'foo', 'bar', 'baz', 'qux.md'),
        join('test', 'fixture', 'foo', 'bar', 'quux.md'),
        join('test', 'fixture', 'foo', 'quuux.md'),
        join('test', 'fixture', 'quuuux.md')
      ],
      'should return files by extension'
    )
  })

  findDown(
    function (file) {
      return file.stem.charAt(0) === 'q'
    },
    tests,
    function (_, files) {
      t.deepEqual(
        check(files).sort(),
        [
          join('test', 'fixture', 'foo', 'bar', 'baz', 'qux.md'),
          join('test', 'fixture', 'foo', 'bar', 'quux.md'),
          join('test', 'fixture', 'foo', 'quuux.md'),
          join('test', 'fixture', 'quuuux.md')
        ],
        'should return files by a test'
      )
    }
  )

  findDown('.test', tests, function (_, files) {
    t.deepEqual(
      check(files),
      [join('test', 'fixture', '.test')],
      'should return hidden files'
    )
  })

  findDown(['.json', '.md'], tests, function (_, files) {
    t.deepEqual(
      check(files).sort(),
      [
        join('test', 'fixture', 'bar', 'baaaz.md'),
        join('test', 'fixture', 'bar', 'foo', 'baaz.md'),
        join('test', 'fixture', 'bar', 'foo', 'bar', 'baz.md'),
        join('test', 'fixture', 'foo.json'),
        join('test', 'fixture', 'foo', 'bar', 'baz', 'qux.md'),
        join('test', 'fixture', 'foo', 'bar', 'quux.md'),
        join('test', 'fixture', 'foo', 'quuux.md'),
        join('test', 'fixture', 'quuuux.md')
      ],
      'should search for multiple tests'
    )
  })

  findDown(
    '.md',
    [
      base('test', 'fixture', 'foo', 'bar', 'baz'),
      base('test', 'fixture', 'bar', 'foo', 'bar')
    ],
    function (_, file) {
      t.deepEqual(
        check(file).sort(),
        [
          join('test', 'fixture', 'bar', 'foo', 'bar', 'baz.md'),
          join('test', 'fixture', 'foo', 'bar', 'baz', 'qux.md')
        ],
        'should search multiple directories'
      )
    }
  )

  findDown('!', tests, function (_, files) {
    t.deepEqual(
      check(files),
      [],
      'should return an empty array when not found #1'
    )
  })

  findDown(['?', '!'], tests, function (_, files) {
    t.deepEqual(
      check(files),
      [],
      'should return an empty array when not found #2'
    )
  })

  findDown(
    function (file) {
      var mask = 0

      if (file.stem.charAt(0) === 'q') {
        mask = INCLUDE
      }

      if (file.stem === 'quuux') {
        mask |= BREAK
      }

      return mask
    },
    tests,
    function (_, files) {
      t.deepEqual(
        check(files),
        [
          join('test', 'fixture', 'quuuux.md'),
          join('test', 'fixture', 'foo', 'quuux.md')
        ],
        'should support `INCLUDE` and `BREAK`'
      )
    }
  )

  findDown('.md', 'missing', function (_, file) {
    t.deepEqual(check(file), [], 'should ignore unfound files')
  })

  findDown(
    '.md',
    [base('test', 'fixture', 'foo'), base('test', 'fixture')],
    function (_, files) {
      t.deepEqual(
        check(files),
        [
          join('test', 'fixture', 'foo', 'quuux.md'),
          join('test', 'fixture', 'foo', 'bar', 'quux.md'),
          join('test', 'fixture', 'foo', 'bar', 'baz', 'qux.md'),
          join('test', 'fixture', 'quuuux.md'),
          join('test', 'fixture', 'bar', 'baaaz.md'),
          join('test', 'fixture', 'bar', 'foo', 'baaz.md'),
          join('test', 'fixture', 'bar', 'foo', 'bar', 'baz.md')
        ],
        'should not duplicate searches'
      )
    }
  )
})

/**
 * Utility to ensure no outbound files are included, and to strip the CWD from
 * paths.
 *
 * @param {Array.<VFile>|VFile|null} files
 * @returns {Array.<string>}
 */
function check(files) {
  if (files === null) {
    return [null]
  }

  return (Array.isArray(files) ? files : [files])
    .map((file) => file.path)
    .filter((filePath) => filePath.indexOf(base()) === 0)
    .map((filePath) => filePath.slice(base().length + 1))
}
