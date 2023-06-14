/**
 * @typedef {import('vfile').VFile} VFile
 */

import assert from 'node:assert/strict'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import {findDown, findDownOne, INCLUDE, BREAK} from '../index.js'

test('core', async function () {
  assert.deepEqual(
    Object.keys(await import('../index.js')).sort(),
    ['BREAK', 'INCLUDE', 'SKIP', 'findDown', 'findDownOne'],
    'should expose the public api'
  )
})

test('findDownOne', async function () {
  await new Promise(function (ok) {
    findDownOne('package.json', function (_, file) {
      assert.deepEqual(
        check(file),
        ['package.json'],
        '`directory` should default to CWD'
      )
      ok(undefined)
    })
  })

  assert.deepEqual(
    check(await findDownOne('package.json')),
    ['package.json'],
    'should support promises'
  )

  await new Promise(function (ok) {
    findDownOne(
      'foo.json',
      path.join(process.cwd(), 'test'),
      function (_, file) {
        assert.deepEqual(
          check(file),
          [path.join('test', 'fixture', 'foo.json')],
          'should search for a file'
        )
        ok(undefined)
      }
    )
  })

  await new Promise(function (ok) {
    findDownOne('.json', path.join(process.cwd(), 'test'), function (_, file) {
      assert.deepEqual(
        check(file),
        [path.join('test', 'fixture', 'foo.json')],
        'should search for an extension'
      )
      ok(undefined)
    })
  })

  await new Promise(function (ok) {
    findDownOne(
      function (file) {
        return file.stem === 'quux'
      },
      path.join(process.cwd(), 'test'),
      function (_, file) {
        assert.deepEqual(
          check(file),
          [path.join('test', 'fixture', 'foo', 'bar', 'quux.md')],
          'should search with a function'
        )
        ok(undefined)
      }
    )
  })

  await new Promise(function (ok) {
    findDownOne('.test', path.join(process.cwd(), 'test'), function (_, file) {
      assert.deepEqual(
        check(file),
        [path.join('test', 'fixture', '.test')],
        'should search for a hidden file'
      )
      ok(undefined)
    })
  })

  await new Promise(function (ok) {
    findDownOne('.md', function (_, file) {
      assert.deepEqual(
        check(file),
        ['readme.md'],
        'should search for the closest file'
      )
      ok(undefined)
    })
  })

  await new Promise(function (ok) {
    findDownOne(
      ['.md', '.json'],
      path.join(process.cwd(), 'test'),
      function (_, file) {
        const list = check(file)
        assert.ok(list.length === 1, 'should search for multiple tests (1)')
        assert.ok(
          list[0] === path.join('test', 'fixture', 'foo.json') ||
            list[0] === path.join('test', 'fixture', 'quuuux.md'),
          'should search for multiple tests (2)'
        )
        ok(undefined)
      }
    )
  })

  await new Promise(function (ok) {
    findDownOne(
      '.md',
      [
        path.join(process.cwd(), 'test', 'fixture', 'foo'),
        path.join(process.cwd(), 'test', 'fixture', 'bar')
      ],
      function (_, file) {
        const list = check(file)
        assert.ok(list.length === 1, 'should search multiple directories (1)')
        assert.ok(
          list[0] === path.join('test', 'fixture', 'foo', 'quuux.md') ||
            list[0] === path.join('test', 'fixture', 'bar', 'baaaz.md'),
          'should search multiple directories (2)'
        )
        ok(undefined)
      }
    )
  })

  await new Promise(function (ok) {
    findDownOne('!', path.join(process.cwd(), 'test'), function (_, file) {
      assert.equal(file, undefined, 'should pass `undefined` when not found #1')
      ok(undefined)
    })
  })

  await new Promise(function (ok) {
    findDownOne(
      ['!', '?'],
      path.join(process.cwd(), 'test'),
      function (_, file) {
        assert.equal(
          file,
          undefined,
          'should pass `undefined` when not found #2'
        )
        ok(undefined)
      }
    )
  })

  await new Promise(function (ok) {
    findDownOne(
      function (file) {
        if (file.stem === 'foo') {
          return INCLUDE
        }
      },
      path.join(process.cwd(), 'test'),
      function (_, file) {
        const list = check(file)
        assert.ok(list.length === 1)
        assert.ok(
          list[0] === path.join('test', 'fixture', 'foo') ||
            list[0] === path.join('test', 'fixture', 'foo.json'),
          'should support `INCLUDE`'
        )
        ok(undefined)
      }
    )
  })

  await new Promise(function (ok) {
    findDownOne(
      function (file) {
        if (file.stem === 'foo') {
          return BREAK
        }
      },
      path.join(process.cwd(), 'test'),
      function (_, file) {
        assert.deepEqual(check(file), [undefined], 'should support `BREAK`')
        ok(undefined)
      }
    )
  })

  await new Promise(function (ok) {
    findDownOne('.md', 'missing', function (_, file) {
      assert.deepEqual(check(file), [undefined], 'should ignore unfound files')
      ok(undefined)
    })
  })
})

test('findDown', async function () {
  await new Promise(function (ok) {
    findDown('package.json', function (_, files) {
      assert.deepEqual(
        check(files),
        ['package.json'],
        '`directory` should default to CWD'
      )
      ok(undefined)
    })
  })

  assert.deepEqual(
    check(await findDown('package.json')),
    ['package.json'],
    'should support promises'
  )

  await new Promise(function (ok) {
    findDown('foo.json', path.join(process.cwd(), 'test'), function (_, files) {
      assert.deepEqual(
        check(files),
        [path.join('test', 'fixture', 'foo.json')],
        'should return files by name and extension'
      )
      ok(undefined)
    })
  })

  await new Promise(function (ok) {
    findDown('.md', path.join(process.cwd(), 'test'), function (_, files) {
      assert.deepEqual(
        check(files).sort(),
        [
          path.join('test', 'fixture', 'bar', 'baaaz.md'),
          path.join('test', 'fixture', 'bar', 'foo', 'baaz.md'),
          path.join('test', 'fixture', 'bar', 'foo', 'bar', 'baz.md'),
          path.join('test', 'fixture', 'foo', 'bar', 'baz', 'qux.md'),
          path.join('test', 'fixture', 'foo', 'bar', 'quux.md'),
          path.join('test', 'fixture', 'foo', 'quuux.md'),
          path.join('test', 'fixture', 'quuuux.md')
        ],
        'should return files by extension'
      )
      ok(undefined)
    })
  })

  await new Promise(function (ok) {
    findDown(
      function (file) {
        return file.stem !== undefined && file.stem.charAt(0) === 'q'
      },
      path.join(process.cwd(), 'test'),
      function (_, files) {
        assert.deepEqual(
          check(files).sort(),
          [
            path.join('test', 'fixture', 'foo', 'bar', 'baz', 'qux.md'),
            path.join('test', 'fixture', 'foo', 'bar', 'quux.md'),
            path.join('test', 'fixture', 'foo', 'quuux.md'),
            path.join('test', 'fixture', 'quuuux.md')
          ],
          'should return files by a test'
        )
        ok(undefined)
      }
    )
  })

  await new Promise(function (ok) {
    findDown('.test', path.join(process.cwd(), 'test'), function (_, files) {
      assert.deepEqual(
        check(files),
        [path.join('test', 'fixture', '.test')],
        'should return hidden files'
      )
      ok(undefined)
    })
  })

  await new Promise(function (ok) {
    findDown(
      ['.json', '.md'],
      path.join(process.cwd(), 'test'),
      function (_, files) {
        assert.deepEqual(
          check(files).sort(),
          [
            path.join('test', 'fixture', 'bar', 'baaaz.md'),
            path.join('test', 'fixture', 'bar', 'foo', 'baaz.md'),
            path.join('test', 'fixture', 'bar', 'foo', 'bar', 'baz.md'),
            path.join('test', 'fixture', 'foo.json'),
            path.join('test', 'fixture', 'foo', 'bar', 'baz', 'qux.md'),
            path.join('test', 'fixture', 'foo', 'bar', 'quux.md'),
            path.join('test', 'fixture', 'foo', 'quuux.md'),
            path.join('test', 'fixture', 'quuuux.md')
          ],
          'should search for multiple tests'
        )
        ok(undefined)
      }
    )
  })

  await new Promise(function (ok) {
    findDown(
      '.md',
      [
        path.join(process.cwd(), 'test', 'fixture', 'foo', 'bar', 'baz'),
        path.join(process.cwd(), 'test', 'fixture', 'bar', 'foo', 'bar')
      ],
      function (_, file) {
        assert.deepEqual(
          check(file).sort(),
          [
            path.join('test', 'fixture', 'bar', 'foo', 'bar', 'baz.md'),
            path.join('test', 'fixture', 'foo', 'bar', 'baz', 'qux.md')
          ],
          'should search multiple directories'
        )
        ok(undefined)
      }
    )
  })

  await new Promise(function (ok) {
    findDown('!', path.join(process.cwd(), 'test'), function (_, files) {
      assert.deepEqual(
        check(files),
        [],
        'should return an empty array when not found #1'
      )
      ok(undefined)
    })
  })

  await new Promise(function (ok) {
    findDown(['?', '!'], path.join(process.cwd(), 'test'), function (_, files) {
      assert.deepEqual(
        check(files),
        [],
        'should return an empty array when not found #2'
      )
      ok(undefined)
    })
  })

  await new Promise(function (ok) {
    findDown(
      function (file) {
        let mask = 0

        if (file.stem && file.stem.charAt(0) === 'q') {
          mask = INCLUDE
        }

        if (file.stem === 'quuux') {
          mask |= BREAK
        }

        return mask
      },
      path.join(process.cwd(), 'test'),
      function (_, files) {
        assert.deepEqual(
          check(files),
          [
            path.join('test', 'fixture', 'quuuux.md'),
            path.join('test', 'fixture', 'foo', 'quuux.md')
          ],
          'should support `INCLUDE` and `BREAK`'
        )
        ok(undefined)
      }
    )
  })

  await new Promise(function (ok) {
    findDown('.md', 'missing', function (_, file) {
      assert.deepEqual(check(file), [], 'should ignore unfound files')
      ok(undefined)
    })
  })

  await new Promise(function (ok) {
    findDown(
      '.md',
      [
        path.join(process.cwd(), 'test', 'fixture', 'foo'),
        path.join(process.cwd(), 'test', 'fixture')
      ],
      function (_, files) {
        assert.deepEqual(
          check(files),
          [
            path.join('test', 'fixture', 'foo', 'quuux.md'),
            path.join('test', 'fixture', 'foo', 'bar', 'quux.md'),
            path.join('test', 'fixture', 'foo', 'bar', 'baz', 'qux.md'),
            path.join('test', 'fixture', 'quuuux.md'),
            path.join('test', 'fixture', 'bar', 'baaaz.md'),
            path.join('test', 'fixture', 'bar', 'foo', 'baaz.md'),
            path.join('test', 'fixture', 'bar', 'foo', 'bar', 'baz.md')
          ],
          'should not duplicate searches'
        )
        ok(undefined)
      }
    )
  })
})

/**
 * Utility to ensure no outbound files are included, and to strip the CWD from
 * paths.
 *
 * @param {Array<VFile> | VFile | undefined} files
 * @returns {Array<string | undefined>}
 */
function check(files) {
  if (files === undefined) {
    return [undefined]
  }

  return (Array.isArray(files) ? files : [files])
    .map(function (file) {
      return file.path
    })
    .filter(function (filePath) {
      return filePath.indexOf(path.join(process.cwd())) === 0
    })
    .map(function (filePath) {
      return filePath.slice(path.join(process.cwd()).length + 1)
    })
}
