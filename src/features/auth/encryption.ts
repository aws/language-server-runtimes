import { Readable } from "stream"

export function shouldWaitForEncryptionKey(): boolean {
    return process.argv.some(arg => arg === '--set-encryption-key')
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
export function readLine(stream: Readable): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let contents = ''

        // Fires when the stream has contents that can be read
        const onStreamIsReadable = () => {
            while (true) {
                const byteRead: Buffer = process.stdin.read(1)
                if (byteRead == null) {
                    // wait for more content to arrive on the stream
                    break
                }

                const nextChar = byteRead.toString('utf-8')
                contents += nextChar

                if (nextChar == '\n') {
                    // Stop reading this stream, we have read a line from it
                    stream.removeListener('readable', onStreamIsReadable)
                    resolve(contents)
                    break
                }
            }
        }

        stream.on('readable', onStreamIsReadable)
    })
}
