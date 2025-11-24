/*
 * Based on windows-system-proxy 1.0.0 (Apache-2.0).
 * https://github.com/httptoolkit/windows-system-proxy/blob/main/test/index.spec.ts
 */
import * as assert from 'assert'
import { getWindowsSystemProxy } from './getWindowsProxySettings'

describe('getWindowsSystemProxy', () => {
    // it('can get the Windows system proxy', function () {
    //     if (process.platform !== 'win32') return this.skip()

    //     const result = getWindowsSystemProxy()
    //     assert.ok(result === undefined || (typeof result === 'object' && result !== null))

    //     if (result) {
    //         assert.strictEqual(typeof result.proxyUrl, 'string')
    //         assert.ok(Array.isArray(result.noProxy))
    //     }
    // })

    it('returns undefined on non-Windows platforms', function () {
        if (process.platform === 'win32') return this.skip()

        const result = getWindowsSystemProxy()
        assert.strictEqual(result, undefined)
    })

    it('handles registry access failure gracefully', function () {
        // This test verifies the function doesn't throw
        assert.doesNotThrow(() => getWindowsSystemProxy())
    })
})
