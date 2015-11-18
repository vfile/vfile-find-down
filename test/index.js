/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module vfile:find-down
 * @version 0.0.0
 * @fileoverview Test suite for `vfile-find-down`.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var test = require('tape');
var path = require('path');
var findDown = require('..');

/*
 * Methods.
 */

var join = path.join;
var base = join.bind(null, process.cwd());

/*
 * Constants.
 */

var tests = base('test');

/**
 * Utility to ensure no outbound files are included, and
 * to strip the CWD from paths.
 */
function check(files) {
    if (files === null) {
        return [files];
    }

    return ('length' in files ? files : [files])
        .map(function (file) {
            return file.filePath();
        })
        .filter(function (filePath) {
            return filePath.indexOf(base()) === 0;
        })
        .map(function (filePath) {
            return filePath.slice(base().length + 1);
        });
}

test('findDown.one', function (t) {
    t.plan(14);

    findDown.one('package.json', function (err, file) {
        t.deepEqual(check(file), ['package.json'], '`directory` should default to CWD');
    });

    findDown.one('foo.json', tests, function (err, file) {
        t.deepEqual(check(file), [
            join('test', 'fixture', 'foo.json')
        ], 'should search for a file');
    });

    findDown.one('.json', tests, function (err, file) {
        t.deepEqual(check(file), [
            join('test', 'fixture', 'foo.json')
        ], 'should search for an extension');
    });

    findDown.one(function (file) {
        return file.filename === 'quux';
    }, tests, function (err, file) {
        t.deepEqual(check(file), [
            join('test', 'fixture', 'foo', 'bar', 'quux.md')
        ], 'should search with a function');
    });

    findDown.one('.test', tests, function (err, file) {
        t.deepEqual(check(file), [
            join('test', 'fixture', '.test')
        ], 'should search for a hidden file');
    });

    findDown.one('.md', function (err, file) {
        t.deepEqual(check(file), [
            'history.md'
        ], 'should search for the closest file');
    });

    findDown.one(['.md', '.json'], tests, function (err, file) {
        t.deepEqual(check(file), [
            join('test', 'fixture', 'foo.json')
        ], 'should search for multiple tests');
    });

    findDown.one('.md', [
        base('test', 'fixture', 'foo'),
        base('test', 'fixture', 'bar')
    ], function (err, file) {
        try {
            t.deepEqual(check(file), [
                join('test', 'fixture', 'foo', 'quuux.md')
            ], 'should search multiple directories');
            t.ok(true);
        } catch (e) {
            t.deepEqual(check(file), [
                join('test', 'fixture', 'bar', 'quuux.md')
            ], 'should search multiple directories');
        }
    });

    findDown.one('!', tests, function (err, file) {
        t.equal(file, null, 'should pass `null` when not found #1');
    });

    findDown.one(['!', '?'], tests, function (err, file) {
        t.equal(file, null, 'should pass `null` when not found #2');
    });

    findDown.one(function (file) {
        if (file.filename === 'foo') {
            return findDown.INCLUDE;
        }
    }, tests, function (err, file) {
        t.deepEqual(check(file), [
            join('test', 'fixture', 'foo')
        ], 'should support `findDown.INCLUDE`');
    });

    findDown.one(function (file) {
        if (file.filename === 'foo') {
            return findDown.BREAK;
        }
    }, tests, function (err, file) {
        t.deepEqual(check(file), [null], 'should support `findDown.BREAK`');
    });

    findDown.one('.md', 'missing', function (err, file) {
        t.deepEqual(check(file), [null], 'should ignore unfound files');
    });
});

test('findDown.all', function (t) {
    t.plan(12);

    findDown.all('package.json', function (err, files) {
        t.deepEqual(check(files), ['package.json'], '`directory` should default to CWD');
    });

    findDown.all('foo.json', tests, function (err, files) {
        t.deepEqual(check(files), [
            join('test', 'fixture', 'foo.json')
        ], 'should return files by name and extension');
    });

    findDown.all('.md', tests, function (err, files) {
        t.deepEqual(check(files).sort(), [
            join('test', 'fixture', 'bar', 'baaaz.md'),
            join('test', 'fixture', 'bar', 'foo', 'baaz.md'),
            join('test', 'fixture', 'bar', 'foo', 'bar', 'baz.md'),
            join('test', 'fixture', 'foo', 'bar', 'baz', 'qux.md'),
            join('test', 'fixture', 'foo', 'bar', 'quux.md'),
            join('test', 'fixture', 'foo', 'quuux.md'),
            join('test', 'fixture', 'quuuux.md')
        ], 'should return files by extension');
    });

    findDown.all(function (file) {
        return file.filename.charAt(0) === 'q';
    }, tests, function (err, files) {
        t.deepEqual(check(files).sort(), [
            join('test', 'fixture', 'foo', 'bar', 'baz', 'qux.md'),
            join('test', 'fixture', 'foo', 'bar', 'quux.md'),
            join('test', 'fixture', 'foo', 'quuux.md'),
            join('test', 'fixture', 'quuuux.md')
        ], 'should return files by a test');
    });

    findDown.all('.test', tests, function (err, files) {
        t.deepEqual(check(files), [
            join('test', 'fixture', '.test')
        ], 'should return hidden files');
    });

    findDown.all(['.json', '.md'], tests, function (err, files) {
        t.deepEqual(check(files).sort(), [
            join('test', 'fixture', 'bar', 'baaaz.md'),
            join('test', 'fixture', 'bar', 'foo', 'baaz.md'),
            join('test', 'fixture', 'bar', 'foo', 'bar', 'baz.md'),
            join('test', 'fixture', 'foo.json'),
            join('test', 'fixture', 'foo', 'bar', 'baz', 'qux.md'),
            join('test', 'fixture', 'foo', 'bar', 'quux.md'),
            join('test', 'fixture', 'foo', 'quuux.md'),
            join('test', 'fixture', 'quuuux.md')
        ], 'should search for multiple tests');
    });

    findDown.all('.md', [
        base('test', 'fixture', 'foo', 'bar', 'baz'),
        base('test', 'fixture', 'bar', 'foo', 'bar')
    ], function (err, file) {
        t.deepEqual(check(file), [
            join('test', 'fixture', 'foo', 'bar', 'baz', 'qux.md'),
            join('test', 'fixture', 'bar', 'foo', 'bar', 'baz.md')
        ], 'should search multiple directories');
    });

    findDown.all('!', tests, function (err, files) {
        t.deepEqual(check(files), [], 'should return an empty array when not found #1');
    });

    findDown.all(['?', '!'], tests, function (err, files) {
        t.deepEqual(check(files), [], 'should return an empty array when not found #2');
    });

    findDown.all(function (file) {
        var mask = 0;

        if (file.filename.charAt(0) === 'q') {
            mask = findDown.INCLUDE;
        }

        if (file.filename === 'quuux') {
            mask = mask | findDown.BREAK;
        }

        return mask;
    }, tests, function (err, files) {
        t.deepEqual(check(files), [
            join('test', 'fixture', 'quuuux.md'),
            join('test', 'fixture', 'foo', 'quuux.md')
        ], 'should support `findDown.INCLUDE` and `findDown.BREAK`');
    });

    findDown.all('.md', 'missing', function (err, file) {
        t.deepEqual(check(file), [], 'should ignore unfound files');
    });

    findDown.all('.md', [
        base('test', 'fixture', 'foo'),
        base('test', 'fixture')
    ], function (err, files) {
        t.deepEqual(check(files), [
            join('test', 'fixture', 'foo', 'quuux.md'),
            join('test', 'fixture', 'foo', 'bar', 'quux.md'),
            join('test', 'fixture', 'foo', 'bar', 'baz', 'qux.md'),
            join('test', 'fixture', 'quuuux.md'),
            join('test', 'fixture', 'bar', 'baaaz.md'),
            join('test', 'fixture', 'bar', 'foo', 'baaz.md'),
            join('test', 'fixture', 'bar', 'foo', 'bar', 'baz.md')
        ], 'should not duplicate searches');
    });
});
