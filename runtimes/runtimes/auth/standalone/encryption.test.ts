import { Readable } from 'stream'
import assert from 'assert'
import {
    EncryptionInitialization,
    isMessageJWEEncrypted,
    readEncryptionDetails,
    shouldWaitForEncryptionKey,
    validateEncryptionDetails,
} from './encryption'
import sinon from 'sinon'

function createReadableStream(): Readable {
    const stream = new Readable()
    // throws error if not implemented
    stream._read = function () {}
    return stream
}

describe('readEncryptionDetails', () => {
    it('resolves with the parsed encryption details', async () => {
        const request: EncryptionInitialization = {
            version: '1.0',
            mode: 'JWT',
            key: 'encryption_key',
        }

        const stream = createReadableStream()
        stream.push(JSON.stringify(request))
        stream.push('\n')

        const result = await readEncryptionDetails(stream)
        assert.deepEqual(result, request)
    })

    it('rejects if no newline is encountered within the timeout', async () => {
        const clock = sinon.useFakeTimers()
        const stream = createReadableStream()
        const timeoutMs = 5000

        await assert.rejects(async () => {
            const promise = readEncryptionDetails(stream)
            clock.tick(timeoutMs)
            await promise
        }, /Encryption details followed by newline must be sent during first/)

        clock.restore()
    })

    it('rejects if bad JSON is sent', async () => {
        const stream = createReadableStream()

        stream.push('badJSON')
        stream.push('\n')

        await assert.rejects(readEncryptionDetails(stream), /SyntaxError/)
    })
})

describe('validateEncryptionDetails', () => {
    it('does not throw for valid encryption details', () => {
        const validEncryptionDetails: EncryptionInitialization = {
            version: '1.0',
            key: 'secret_key',
            mode: 'JWT',
        }

        assert.doesNotThrow(() => validateEncryptionDetails(validEncryptionDetails))
    })

    it('throws for unsupported initialization version', () => {
        const invalidVersionEncryptionDetails: EncryptionInitialization = {
            version: '2.0', // Unsupported version
            key: 'secret_key',
            mode: 'JWT',
        }

        assert.throws(
            () => validateEncryptionDetails(invalidVersionEncryptionDetails),
            /Unsupported initialization version: 2.0/
        )
    })

    it('throws for missing encryption key', () => {
        const missingKeyEncryptionDetails = {
            version: '1.0',
            // Missing key
            mode: 'JWT',
        }

        assert.throws(
            () => validateEncryptionDetails(missingKeyEncryptionDetails as EncryptionInitialization),
            /Encryption key is missing/
        )
    })

    it('throws for unsupported encoding mode', () => {
        const invalidModeEncryptionDetails = {
            version: '1.0',
            key: 'secret_key',
            mode: 'AES', // Unsupported mode
        }

        assert.throws(
            () => validateEncryptionDetails(invalidModeEncryptionDetails as EncryptionInitialization),
            /Unsupported encoding mode: AES/
        )
    })
})

describe('shouldWaitForEncryptionKey', () => {
    it('should return true when --set-credentials-encryption-key is in process.argv', () => {
        const originalArgv = process.argv
        process.argv = ['--set-credentials-encryption-key']

        assert.strictEqual(shouldWaitForEncryptionKey(), true)

        process.argv = originalArgv
    })

    it('should return false when --set-credentials-encryption-key is not in process.argv', () => {
        const originalArgv = process.argv
        process.argv = ['--some-other-arg']

        assert.strictEqual(shouldWaitForEncryptionKey(), false)

        process.argv = originalArgv
    })
})

describe('isMessageJWEEncrypted', () => {
    it('should return false if the message does not have 5 parts separated by periods', () => {
        const message = 'part1.part2.part3.part4'
        const result = isMessageJWEEncrypted(message, 'alg', 'enc')
        assert.strictEqual(result, false)
    })

    it('should return false if the protected header is not valid base64url', () => {
        const message = 'invalid..part2.part3.part4.part5'
        const result = isMessageJWEEncrypted(message, 'alg', 'enc')
        assert.strictEqual(result, false)
    })

    it('should return false if the protected header is not a valid JSON', () => {
        const message = 'aW52YWxpZA==.part2.part3.part4.part5' // "invalid" in base64url
        const result = isMessageJWEEncrypted(message, 'alg', 'enc')
        assert.strictEqual(result, false)
    })

    it('should return false if the protected header does not contain the expected fields', () => {
        const header = Buffer.from(JSON.stringify({ wrongField: 'value' })).toString('base64url')
        const message = `${header}.part2.part3.part4.part5`
        const result = isMessageJWEEncrypted(message, 'alg', 'enc')
        assert.strictEqual(result, false)
    })

    it('should return false if the protected header contains wrong algorithm', () => {
        const header = Buffer.from(JSON.stringify({ alg: 'wrongAlg', enc: 'enc' })).toString('base64url')
        const message = `${header}.part2.part3.part4.part5`
        const result = isMessageJWEEncrypted(message, 'alg', 'enc')
        assert.strictEqual(result, false)
    })

    it('should return false if the protected header contains wrong encoding', () => {
        const header = Buffer.from(JSON.stringify({ alg: 'alg', enc: 'wrongEnc' })).toString('base64url')
        const message = `${header}.part2.part3.part4.part5`
        const result = isMessageJWEEncrypted(message, 'alg', 'enc')
        assert.strictEqual(result, false)
    })

    it('should return true if the protected header contains the expected algorithm and encoding', () => {
        const header = Buffer.from(JSON.stringify({ alg: 'alg', enc: 'enc' })).toString('base64url')
        const message = `${header}.part2.part3.part4.part5`
        const result = isMessageJWEEncrypted(message, 'alg', 'enc')
        assert.strictEqual(result, true)
    })
})
