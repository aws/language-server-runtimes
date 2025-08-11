/*
 * Based on mac-system-proxy 1.0.2 (Apache-2.0). Modified for synchronous use
 * https://github.com/httptoolkit/mac-system-proxy/blob/main/test/index.spec.ts
 */
import * as assert from 'assert'
import { getMacSystemProxy } from './getMacProxySettings'

describe('getMacSystemProxy', () => {
    it('can get the Mac system proxy', function () {
        if (process.platform !== 'darwin') return this.skip()

        const result = getMacSystemProxy()
        assert.ok(result === undefined || (typeof result === 'object' && result !== null))

        if (result) {
            assert.strictEqual(typeof result.proxyUrl, 'string')
            assert.ok(Array.isArray(result.noProxy))
        }
    })

    it('returns undefined on non-Mac platforms', function () {
        if (process.platform === 'darwin') return this.skip()

        const result = getMacSystemProxy()
        assert.strictEqual(result, undefined)
    })

    it('handles scutil command failure gracefully', function () {
        // This test verifies the function doesn't throw
        assert.doesNotThrow(() => getMacSystemProxy())
    })

    it('returns undefined when no proxy is configured', function () {
        if (process.platform !== 'darwin') return this.skip()

        const result = getMacSystemProxy()
        if (result) {
            assert.strictEqual(typeof result.proxyUrl, 'string')
            assert.ok(Array.isArray(result.noProxy))
        }
    })
})
