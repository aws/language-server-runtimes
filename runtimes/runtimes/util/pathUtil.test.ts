import * as assert from 'assert'
import { joinUnixPaths } from './pathUtil'

describe('joinUnixPaths', function () {
    it('handles basic joining', function () {
        assert.strictEqual(joinUnixPaths('foo', 'bar'), 'foo/bar')
        assert.strictEqual(joinUnixPaths('foo'), 'foo')
        assert.strictEqual(joinUnixPaths(), '')
        assert.strictEqual(joinUnixPaths(''), '')
    })

    it('ignores leading and trailing slashes', function () {
        assert.strictEqual(joinUnixPaths('/foo', 'bar'), 'foo/bar')
        assert.strictEqual(joinUnixPaths('foo/', 'bar'), 'foo/bar')
        assert.strictEqual(joinUnixPaths('foo', '/bar'), 'foo/bar')
        assert.strictEqual(joinUnixPaths('foo', 'bar/'), 'foo/bar')
        assert.strictEqual(joinUnixPaths('/foo/', '/bar/'), 'foo/bar')
    })

    it('handles multiple consecutive slashes', function () {
        assert.strictEqual(joinUnixPaths('foo//', '//bar'), 'foo/bar')
        assert.strictEqual(joinUnixPaths('///foo///', '///bar///'), 'foo/bar')
        assert.strictEqual(joinUnixPaths('foo///bar'), 'foo/bar')
    })

    it('handles dot segments correctly', function () {
        assert.strictEqual(joinUnixPaths('foo', '.', 'bar'), 'foo/bar')
        assert.strictEqual(joinUnixPaths('foo/./bar'), 'foo/bar')
        assert.strictEqual(joinUnixPaths('./foo/bar'), 'foo/bar')
        assert.strictEqual(joinUnixPaths('foo/bar/.'), 'foo/bar')
    })

    it('handles double-dot segments correctly', function () {
        assert.strictEqual(joinUnixPaths('foo', '..', 'bar'), 'bar')
        assert.strictEqual(joinUnixPaths('foo/bar/..'), 'foo')
        assert.strictEqual(joinUnixPaths('foo/../bar'), 'bar')
        assert.strictEqual(joinUnixPaths('foo/bar/../baz'), 'foo/baz')
        assert.strictEqual(joinUnixPaths('foo/bar/../../baz'), 'baz')
    })

    it('handles complex path combinations', function () {
        assert.strictEqual(joinUnixPaths('/foo/bar', '../baz/./qux/'), 'foo/baz/qux')
        assert.strictEqual(joinUnixPaths('foo/./bar', '../baz//qux/..'), 'foo/baz')
        assert.strictEqual(joinUnixPaths('/foo/bar/', './baz/../qux'), 'foo/bar/qux')
        assert.strictEqual(joinUnixPaths('foo', 'bar', 'baz', '..', 'qux'), 'foo/bar/qux')
    })

    it('handles empty segments', function () {
        assert.strictEqual(joinUnixPaths('foo', '', 'bar'), 'foo/bar')
        assert.strictEqual(joinUnixPaths('', 'foo', '', 'bar', ''), 'foo/bar')
    })

    it('handles paths with multiple consecutive dots', function () {
        assert.strictEqual(joinUnixPaths('foo', '...', 'bar'), 'foo/.../bar')
        assert.strictEqual(joinUnixPaths('foo/...bar'), 'foo/...bar')
    })
})
