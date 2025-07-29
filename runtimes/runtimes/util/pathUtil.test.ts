import * as assert from 'assert'
import { joinUnixPaths, basenamePath } from './pathUtil'

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

describe('basenameUnixPath', function () {
    it('handles basic filename extraction', function () {
        assert.strictEqual(basenamePath('/path/to/file.txt'), 'file.txt')
        assert.strictEqual(basenamePath('path/to/file.txt'), 'file.txt')
        assert.strictEqual(basenamePath('file.txt'), 'file.txt')
        assert.strictEqual(basenamePath('filename'), 'filename')
    })

    it('handles directory paths', function () {
        assert.strictEqual(basenamePath('/path/to/dir/'), 'dir')
        assert.strictEqual(basenamePath('/path/to/dir'), 'dir')
        assert.strictEqual(basenamePath('path/to/dir/'), 'dir')
        assert.strictEqual(basenamePath('dir/'), 'dir')
    })

    it('handles root and empty paths', function () {
        assert.strictEqual(basenamePath('/'), '')
        assert.strictEqual(basenamePath(''), '')
        assert.strictEqual(basenamePath('//'), '')
        assert.strictEqual(basenamePath('///'), '')
    })

    it('handles extension removal', function () {
        assert.strictEqual(basenamePath('/path/to/file.txt', '.txt'), 'file')
        assert.strictEqual(basenamePath('/path/to/file.txt', 'txt'), 'file.')
        assert.strictEqual(basenamePath('file.js', '.js'), 'file')
        assert.strictEqual(basenamePath('file.js', 'js'), 'file.')
    })

    it('handles extension removal edge cases', function () {
        assert.strictEqual(basenamePath('file.txt', '.js'), 'file.txt')
        assert.strictEqual(basenamePath('file', '.txt'), 'file')
        assert.strictEqual(basenamePath('file.txt.bak', '.txt'), 'file.txt.bak')
        assert.strictEqual(basenamePath('file.txt.bak', '.bak'), 'file.txt')
    })

    it('handles Windows-style paths', function () {
        assert.strictEqual(basenamePath('C:\\path\\to\\file.txt'), 'file.txt')
        assert.strictEqual(basenamePath('path\\to\\file.txt'), 'file.txt')
        assert.strictEqual(basenamePath('C:\\path\\to\\dir\\'), 'dir')
    })

    it('handles mixed path separators', function () {
        assert.strictEqual(basenamePath('/path\\to/file.txt'), 'file.txt')
        assert.strictEqual(basenamePath('path/to\\dir/'), 'dir')
    })

    it('handles multiple consecutive slashes', function () {
        assert.strictEqual(basenamePath('/path//to///file.txt'), 'file.txt')
        assert.strictEqual(basenamePath('path///to//dir///'), 'dir')
        assert.strictEqual(basenamePath('///path///file.txt'), 'file.txt')
    })

    it('handles special filenames', function () {
        assert.strictEqual(basenamePath('/path/to/.hidden'), '.hidden')
        assert.strictEqual(basenamePath('/path/to/..'), '..')
        assert.strictEqual(basenamePath('/path/to/.'), '.')
        assert.strictEqual(basenamePath('/path/to/...'), '...')
    })

    it('handles invalid inputs', function () {
        assert.strictEqual(basenamePath(null as any), '')
        assert.strictEqual(basenamePath(undefined as any), '')
        assert.strictEqual(basenamePath(123 as any), '')
    })

    it('handles complex extension scenarios', function () {
        assert.strictEqual(basenamePath('file.tar.gz', '.gz'), 'file.tar')
        assert.strictEqual(basenamePath('file.tar.gz', '.tar.gz'), 'file')
        assert.strictEqual(basenamePath('archive.tar.gz', 'tar.gz'), 'archive.')
    })

    it('handles files without extensions', function () {
        assert.strictEqual(basenamePath('/path/to/README'), 'README')
        assert.strictEqual(basenamePath('/path/to/Makefile'), 'Makefile')
        assert.strictEqual(basenamePath('LICENSE', '.txt'), 'LICENSE')
    })
})
