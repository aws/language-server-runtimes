import { EncryptedChat } from './encryptedChat'
import { SinonStub, stub, spy, assert as sinonAssert } from 'sinon'
import { encryptObjectWithKey } from '../auth/standalone/encryption'
import { CancellationToken } from 'vscode-languageserver-protocol'
import assert from 'assert'
import { chatRequestType, quickActionRequestType } from '../../protocol'

class ConnectionMock {
    public onRequest: SinonStub
    public onNotification: SinonStub

    constructor() {
        this.onRequest = stub()
        this.onNotification = stub()
    }

    public triggerRequest(method: string, params: any, cancellationToken: any) {
        const handler = this.onRequest.getCall(0).args[1]
        return handler(params, cancellationToken)
    }

    public triggerNotification(method: string, params: any) {
        const handler = this.onNotification.getCall(0).args[1]
        return handler(params)
    }
}

const testKey = Buffer.from('a'.repeat(32)).toString('base64') // Key has to be 256 bit long in our JWE configuration

describe('EncryptedChat', () => {
    let connection: ConnectionMock
    let encryptedChat: EncryptedChat

    beforeEach(() => {
        connection = new ConnectionMock()
        encryptedChat = new EncryptedChat(connection as any, testKey, 'JWT')
    })

    it('should reject unencrypted onChatPrompt requests', async () => {
        const handler = spy()
        encryptedChat.onChatPrompt(handler)

        const result = await connection.triggerRequest(
            chatRequestType.method,
            { message: 'unencryptedMessage' },
            CancellationToken.None
        )
        assert(result instanceof Error)
        assert.strictEqual(result.message, 'The request was not encrypted correctly')
        sinonAssert.notCalled(handler)
    })

    it('should handle encrypted onChatPrompt requests', async () => {
        const handler = spy(params => params)
        encryptedChat.onChatPrompt(handler)

        const encryptedRequest = {
            message: await encryptObjectWithKey({ body: 'something' }, testKey, 'dir', 'A256GCM'),
        }

        const result = await connection.triggerRequest(chatRequestType.method, encryptedRequest, CancellationToken.None)
        assert(!(result instanceof Error))
        sinonAssert.calledOnce(handler)
    })

    it('should reject unencrypted onQuickAction requests', async () => {
        const handler = spy()
        encryptedChat.onQuickAction(handler)

        const result = await connection.triggerRequest(
            quickActionRequestType.method,
            { message: 'unencryptedMessage' },
            CancellationToken.None
        )
        assert(result instanceof Error)
        assert.strictEqual(result.message, 'The request was not encrypted correctly')
        sinonAssert.notCalled(handler)
    })

    it('should handle encrypted onQuickAction requests', async () => {
        const handler = spy(params => params)
        encryptedChat.onQuickAction(handler)

        const encryptedRequest = {
            message: await encryptObjectWithKey({ tabId: 'tab-1', quickAction: '/help' }, testKey, 'dir', 'A256GCM'),
        }

        const result = await connection.triggerRequest(
            quickActionRequestType.method,
            encryptedRequest,
            CancellationToken.None
        )
        assert(!(result instanceof Error))
        sinonAssert.calledOnce(handler)
    })
})
