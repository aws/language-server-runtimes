import { Readable } from 'stream'
import { CompactEncrypt } from 'jose'
import { GetIamCredentialResult, GetSsoTokenResult } from '../../../protocol'

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
export function encryptObjectWithKey(request: Object, key: string, alg?: string, enc?: string): Promise<string> {
    const payload = new TextEncoder().encode(JSON.stringify(request))
    const keyBuffer = Buffer.from(key, 'base64')
    return new CompactEncrypt(payload)
        .setProtectedHeader({ alg: alg ?? 'dir', enc: enc ?? 'A256GCM' })
        .encrypt(keyBuffer)
}

/**
 * Encrypts the SSO access tokens inside the result object with the provided key
 */
export async function encryptSsoResultWithKey(request: GetSsoTokenResult, key: string): Promise<GetSsoTokenResult> {
    if (request.ssoToken.accessToken) {
        request.ssoToken.accessToken = await encryptObjectWithKey(request.ssoToken.accessToken, key)
    }
    if (request.updateCredentialsParams.data && !request.updateCredentialsParams.encrypted) {
        request.updateCredentialsParams.data = await encryptObjectWithKey(
            // decodeCredentialsRequestToken expects nested 'data' fields
            { data: request.updateCredentialsParams.data },
            key
        )
        request.updateCredentialsParams.encrypted = true
    }
    return request
}

/**
 * Encrypts the IAM credentials inside the result object with the provided key
 */
export async function encryptIamResultWithKey(
    request: GetIamCredentialResult,
    key: string
): Promise<GetIamCredentialResult> {
    request.credential.credentials = {
        accessKeyId: await encryptObjectWithKey(request.credential.credentials.accessKeyId, key),
        secretAccessKey: await encryptObjectWithKey(request.credential.credentials.secretAccessKey, key),
        ...(request.credential.credentials.sessionToken
            ? { sessionToken: await encryptObjectWithKey(request.credential.credentials.sessionToken, key) }
            : {}),
    }
    if (!request.updateCredentialsParams.encrypted) {
        request.updateCredentialsParams.data = await encryptObjectWithKey(
            { data: request.updateCredentialsParams.data },
            key
        )
        request.updateCredentialsParams.encrypted = true
    }
    return request
}

/**
 * Check if a message is an encrypted JWE message with the provided key management algorithm and encoding
 * As per RFC-7516:
 *  When using the JWE Compact Serialization, the
 *  JWE Protected Header, the JWE Encrypted Key, the JWE
 *  Initialization Vector, the JWE Ciphertext, and the JWE
 *  Authentication Tag are represented as base64url-encoded values
 *  in that order, with each value being separated from the next by
 *  a single period ('.') character, resulting in exactly four
 *  delimiting period characters being used
 * This function checks if the payload is separated by 4 periods and
 * Decodes the protected header and verifies that it contains the given key management and content encryption algorithms
 */
export function isMessageJWEEncrypted(message: string, algorithm: string, encoding: string) {
    // Check if the message has five parts separated by periods
    const parts = message.split('.')
    if (parts.length !== 5) {
        return false
    }

    try {
        // Decode the protected header (first part of the message)
        const protectedHeader = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf-8'))

        // Check if the header contains the expected fields
        if (
            protectedHeader.alg &&
            protectedHeader.enc &&
            protectedHeader.alg == algorithm &&
            protectedHeader.enc == encoding
        ) {
            return true
        }
    } catch (e) {
        return false
    }

    return false
}
