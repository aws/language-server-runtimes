import { jwtDecrypt, EncryptJWT, JWTPayload } from 'jose'
import { Connection } from 'vscode-languageserver'
import {
    ChatParams,
    ChatResult,
    EndChatParams,
    FeedbackParams,
    FollowUpClickParams,
    InfoLinkClickParams,
    InsertToCursorPositionParams,
    LinkClickParams,
    NotificationHandler,
    QuickActionParams,
    QuickActionResult,
    RequestHandler,
    SourceLinkClickParams,
    TabAddParams,
    TabChangeParams,
    TabRemoveParams,
    chatRequestType,
    feedbackNotificationType,
    readyNotificationType,
    tabAddNotificationType,
    tabChangeNotificationType,
    tabRemoveNotificationType,
    insertToCursorPositionNotificationType,
    linkClickNotificationType,
    infoLinkClickNotificationType,
    sourceLinkClickNotificationType,
    followUpClickNotificationType,
    endChatRequestType,
    CancellationToken,
    EncryptedChatParams,
    EncryptedQuickActionParams,
    quickActionRequestType,
} from '../../protocol'
import { Chat } from '../../server-interface'
import { CredentialsEncoding } from '../auth/standalone/encryption'

export class EncryptedChat implements Chat {
    private key: Buffer
    private encoding: CredentialsEncoding | undefined

    constructor(
        private readonly connection: Connection,
        key: string,
        encoding?: CredentialsEncoding
    ) {
        this.key = Buffer.from(key, 'base64')
        this.encoding = encoding
    }

    public onChatPrompt(handler: RequestHandler<ChatParams, ChatResult | null | undefined, ChatResult>) {
        this.connection.onRequest(chatRequestType, async (request: ChatParams | EncryptedChatParams) => {
            request = request as EncryptedChatParams
            // decrypt the request params
            let decryptedRequest = (await this.decodeRequest(request)) as ChatParams

            // make sure we don't lose the partial result token
            if (request.partialResultToken) {
                decryptedRequest.partialResultToken = request.partialResultToken
            }

            // call the handler with plaintext
            const response = (await handler(decryptedRequest, CancellationToken.None)) as ChatResult
            // encrypt the response
            const encryptedResponse = await this.encryptObject(response as JWTPayload)
            // send it back
            return encryptedResponse
        })
    }

    public onQuickAction(handler: RequestHandler<QuickActionParams, QuickActionResult, void>) {
        this.connection.onRequest(
            quickActionRequestType,
            async (request: QuickActionParams | EncryptedQuickActionParams) => {
                request = request as EncryptedQuickActionParams
                // decrypt the request params
                let decryptedRequest = (await this.decodeRequest(request)) as QuickActionParams

                // make sure we don't lose the partial result token
                if (request.partialResultToken) {
                    decryptedRequest.partialResultToken = request.partialResultToken
                }

                // call the handler with plaintext
                const response = (await handler(decryptedRequest, CancellationToken.None)) as QuickActionResult
                // encrypt the response
                const encryptedResponse = await this.encryptObject(response as JWTPayload)
                // send it back
                return encryptedResponse
            }
        )
    }
    public onEndChat(handler: RequestHandler<EndChatParams, boolean, void>) {
        return this.connection.onRequest(endChatRequestType, handler)
    }

    public onSendFeedback(handler: NotificationHandler<FeedbackParams>) {
        this.connection.onNotification(feedbackNotificationType.method, handler)
    }
    public onReady(handler: NotificationHandler<void>) {
        this.connection.onNotification(readyNotificationType.method, handler)
    }
    public onTabAdd(handler: NotificationHandler<TabAddParams>) {
        this.connection.onNotification(tabAddNotificationType.method, handler)
    }
    public onTabChange(handler: NotificationHandler<TabChangeParams>) {
        this.connection.onNotification(tabChangeNotificationType.method, handler)
    }
    public onTabRemove(handler: NotificationHandler<TabRemoveParams>) {
        this.connection.onNotification(tabRemoveNotificationType.method, handler)
    }
    public onCodeInsertToCursorPosition(handler: NotificationHandler<InsertToCursorPositionParams>) {
        this.connection.onNotification(insertToCursorPositionNotificationType.method, handler)
    }
    public onLinkClick(handler: NotificationHandler<LinkClickParams>) {
        this.connection.onNotification(linkClickNotificationType.method, handler)
    }
    public onInfoLinkClick(handler: NotificationHandler<InfoLinkClickParams>) {
        this.connection.onNotification(infoLinkClickNotificationType.method, handler)
    }
    public onSourceLinkClick(handler: NotificationHandler<SourceLinkClickParams>) {
        this.connection.onNotification(sourceLinkClickNotificationType.method, handler)
    }
    public onFollowUpClicked(handler: NotificationHandler<FollowUpClickParams>) {
        this.connection.onNotification(followUpClickNotificationType.method, handler)
    }

    private async decodeRequest<T>(request: EncryptedChatParams | EncryptedQuickActionParams): Promise<T> {
        if (!this.key) {
            throw new Error('No encryption key')
        }

        if (this.encoding === 'JWT') {
            const result = await jwtDecrypt(request.message, this.key, {
                clockTolerance: 60, // Allow up to 60 seconds to account for clock differences
                contentEncryptionAlgorithms: ['A256GCM'],
                keyManagementAlgorithms: ['dir'],
            })

            if (!result.payload) {
                throw new Error('JWT payload not found')
            }
            return result.payload as T
        }
        throw new Error('Encoding mode not implemented')
    }

    private async encryptObject(object: JWTPayload): Promise<string> {
        const encryptedJWT = await new EncryptJWT(object)
            .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
            .encrypt(this.key)
        return encryptedJWT
    }
}
