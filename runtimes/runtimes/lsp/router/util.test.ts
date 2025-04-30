import assert from 'assert'
import { isPrimitive } from './util'

describe('Util', () => {
    it('should return true primitive types: isPrimitive', () => {
        assert.strictEqual(isPrimitive('random str'), true)
        assert.strictEqual(isPrimitive(123), true)
        assert.strictEqual(isPrimitive(123.23), true)
        assert.strictEqual(isPrimitive(false), true)
        assert.strictEqual(isPrimitive(undefined), true)
        assert.strictEqual(isPrimitive(null), true)
    })

    it('should return false for non-primitive types: isPrimitive', () => {
        assert.strictEqual(isPrimitive({ a: 1 }), false)
        assert.strictEqual(isPrimitive([1]), false)
    })
})
