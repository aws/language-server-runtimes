import { jwtDecrypt } from 'jose'
import { Connection } from 'vscode-languageserver'
import {
    ChatParams,
    ChatResult,
    QuickActionParams,
    QuickActionResult,
    RequestHandler,
    chatRequestType,
    CancellationToken,
    EncryptedChatParams,
    EncryptedQuickActionParams,
    quickActionRequestType,
    ResponseError,
    LSPErrorCodes,
} from '../../protocol'
import { CredentialsEncoding, encryptObjectWithKey, isMessageJWEEncrypted } from '../auth/standalone/encryption'
import { BaseChat } from './baseChat'

// Default JWE configuration
const KEY_MANAGEMENT_ALGORITHM = 'dir'
const CONTENT_ENCRYPTION_ALGORITHM = 'A256GCM'

type EncryptedRequestParams = EncryptedQuickActionParams | EncryptedChatParams

export class EncryptedChat extends BaseChat {
    // Store key as both string and buffer since both are used
    private keyBuffer: Buffer

    constructor(
        connection: Connection,
        private key: string,
        private encoding?: CredentialsEncoding
    ) {
        super(connection)
        this.keyBuffer = Buffer.from(key, 'base64')
    }

    public onChatPrompt(handler: RequestHandler<ChatParams, ChatResult | null | undefined, ChatResult>) {
        this.registerEncryptedRequestHandler<
            EncryptedChatParams,
            ChatParams,
            ChatResult | null | undefined,
            ChatResult
        >(chatRequestType, handler)
    }

    public onQuickAction(handler: RequestHandler<QuickActionParams, QuickActionResult, void>) {
        this.registerEncryptedRequestHandler<EncryptedQuickActionParams, QuickActionParams, QuickActionResult, void>(
            quickActionRequestType,
            handler
        )
    }

    private registerEncryptedRequestHandler<
        EncryptedRequestType extends EncryptedRequestParams,
        DecryptedRequestType extends ChatParams | QuickActionParams,
        ResponseType,
        ErrorType,
    >(requestType: any, handler: RequestHandler<DecryptedRequestType, ResponseType, ErrorType>) {
        this.connection.onRequest(
            requestType,
            async (request: EncryptedRequestType | DecryptedRequestType, cancellationToken: CancellationToken) => {
                // Verify the request is encrypted as expected
                if (this.instanceOfEncryptedParams<EncryptedRequestType>(request)) {
                    // Decrypt request
                    let decryptedRequest
                    try {
                        decryptedRequest = await this.decodeRequest<DecryptedRequestType>(request)
                    } catch (err: unknown) {
                        let errorMessage = 'Request could not be decrypted'
                        if (err instanceof Error) errorMessage = err.message
                        return new ResponseError<ResponseType>(LSPErrorCodes.ServerCancelled, errorMessage)
                    }

                    // Preserve the partial result token
                    if (request.partialResultToken) {
                        decryptedRequest.partialResultToken = request.partialResultToken
                    }

                    // Call the handler with decrypted params
                    const response = await handler(decryptedRequest, cancellationToken)

                    // If response is null, undefined or a response error, return it as is
                    if (!response || response instanceof ResponseError) {
                        return response
                    }

                    // Encrypt the response and return it
                    const encryptedResponse = await encryptObjectWithKey(
                        response,
                        this.key,
                        KEY_MANAGEMENT_ALGORITHM,
                        CONTENT_ENCRYPTION_ALGORITHM
                    )

                    return encryptedResponse
                }

                return new ResponseError<ResponseType>(
                    LSPErrorCodes.ServerCancelled,
                    'The request was not encrypted correctly'
                )
            }
        )
    }

    private instanceOfEncryptedParams<T>(object: any): object is T {
        if ('message' in object && typeof object['message'] === `string`) {
            return isMessageJWEEncrypted(object.message, KEY_MANAGEMENT_ALGORITHM, CONTENT_ENCRYPTION_ALGORITHM)
        }

        return false
    }

    private async decodeRequest<T>(request: EncryptedRequestParams): Promise<T> {
        if (!this.key) {
            throw new Error('No encryption key')
        }

        if (this.encoding === 'JWT') {
            const result = await jwtDecrypt(request.message, this.keyBuffer, {
                clockTolerance: 60,
                contentEncryptionAlgorithms: [CONTENT_ENCRYPTION_ALGORITHM],
                keyManagementAlgorithms: [KEY_MANAGEMENT_ALGORITHM],
            })

            if (!result.payload) {
                throw new Error('JWT payload not found')
            }
            return result.payload as T
        }
        throw new Error('Encoding mode not implemented')
    }
}
