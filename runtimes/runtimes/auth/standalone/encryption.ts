import { Readable } from 'stream'
import { CompactEncrypt } from 'jose'

export function shouldWaitForEncryptionKey(): boolean {
    return process.argv.some(arg => arg === '--set-credentials-encryption-key')
}

export type CredentialsEncoding = 'JWT'

/**
 * Runtimes expect destinations to provide this payload as part of the startup sequence
 * if encrypted credentials are required
 */
export type EncryptionInitialization = {
    /**
     * The version of this payload.
     * If the property is set to a value that the server has not implemented, or
     * does not support, a fatal exception is thrown.
     */
    version: string
    /**
     * Indicates how credentials tokens will be encoded for this session.
     */
    mode: CredentialsEncoding
    /**
     * Base64 encoding of the encryption key to be used for the duration of this session.
     */
    key: string
}

export function validateEncryptionDetails(encryptionDetails: EncryptionInitialization) {
    if (encryptionDetails.version !== '1.0') {
        throw new Error(`Unsupported initialization version: ${encryptionDetails.version}`)
    }

    if (!encryptionDetails.key) {
        throw new Error(`Encryption key is missing`)
    }

    if (encryptionDetails.mode !== 'JWT') {
        throw new Error(`Unsupported encoding mode: ${encryptionDetails.mode}`)
    }
}

/**
 * Read from the given stream, stopping after the first newline (\n).
 * Return the string consumed from the stream.
 */
export function readEncryptionDetails(stream: Readable): Promise<EncryptionInitialization> {
    return new Promise<EncryptionInitialization>((resolve, reject) => {
        let buffer = Buffer.alloc(0)
        const TIMEOUT_INTERVAL_MS = 5000

        const timer: NodeJS.Timeout = setTimeout(() => {
            clearTimer()
            stream.removeListener('readable', onStreamIsReadable)
            reject(`Encryption details followed by newline must be sent during first ${TIMEOUT_INTERVAL_MS}ms`)
        }, TIMEOUT_INTERVAL_MS)

        const clearTimer = () => {
            if (timer) {
                clearTimeout(timer)
            }
        }

        // Fires when the stream has contents that can be read
        const onStreamIsReadable = () => {
            let byteRead
            while ((byteRead = stream.read(1)) !== null) {
                if (byteRead.toString('utf-8') == '\n') {
                    clearTimer()
                    // Stop reading this stream, we have read a line from it
                    stream.removeListener('readable', onStreamIsReadable)
                    try {
                        resolve(JSON.parse(buffer.toString('utf-8')) as EncryptionInitialization)
                    } catch (error) {
                        reject(error)
                    }
                    break
                } else {
                    buffer = Buffer.concat([buffer, byteRead])
                }
            }
        }

        stream.on('readable', onStreamIsReadable)
    })
}

/**
 * Encrypt an object with the provided key
 */
export function encryptObjectWithKey(request: Object, key: string): Promise<string> {
    const payload = new TextEncoder().encode(JSON.stringify(request))
    const keyBuffer = Buffer.from(key, 'base64')
    return new CompactEncrypt(payload).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }).encrypt(keyBuffer)
}
