/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import sinon, { stubInterface } from 'ts-sinon'
import { RuntimeProps } from './runtime'
import assert from 'assert'
import { standalone } from './standalone'
import * as vscodeLanguageServer from 'vscode-languageserver/node'
import * as lspRouterModule from './lsp/router/lspRouter'
import { LspServer } from './lsp/router/lspServer'
import * as authEncryptionModule from './auth/standalone/encryption'
import * as authModule from './auth/auth'
import * as baseChatModule from './chat/baseChat'
import * as textDocumentConnectionModule from './lsp/textDocuments/textDocumentConnection'
import { DidSaveTextDocumentParams } from '../protocol'

describe('standalone document save handling', () => {
    let stubServer: sinon.SinonStub
    let props: RuntimeProps
    let stubConnection: sinon.SinonStubbedInstance<vscodeLanguageServer.Connection> & vscodeLanguageServer.Connection
    let lspRouterStub: sinon.SinonStubbedInstance<lspRouterModule.LspRouter> & lspRouterModule.LspRouter
    let authStub: sinon.SinonStubbedInstance<authModule.Auth> & authModule.Auth
    let baseChatStub: sinon.SinonStubbedInstance<baseChatModule.BaseChat> & baseChatModule.BaseChat
    let documentObserverStub: any
    let saveTextDocumentHandlerSpy: sinon.SinonSpy

    beforeEach(() => {
        // Set up stubs
        stubServer = sinon.stub()
        props = {
            version: '0.1.0',
            servers: [stubServer],
            name: 'Test',
        }
        stubConnection = stubInterface<vscodeLanguageServer.Connection>()
        stubConnection.console = stubInterface<vscodeLanguageServer.RemoteConsole>()
        stubConnection.telemetry = stubInterface<vscodeLanguageServer.Telemetry>()

        sinon.stub(vscodeLanguageServer, 'createConnection').returns(stubConnection)

        lspRouterStub = stubInterface<lspRouterModule.LspRouter>()
        lspRouterStub.servers = stubInterface<LspServer[]>()
        sinon.stub(lspRouterModule, 'LspRouter').returns(lspRouterStub)

        // Mock auth and chat
        sinon.stub(authEncryptionModule, 'shouldWaitForEncryptionKey').returns(false)
        authStub = stubInterface<authModule.Auth>()
        authStub.getCredentialsProvider.returns({
            hasCredentials: sinon.stub().returns(false),
            getCredentials: sinon.stub().returns(undefined),
            getConnectionMetadata: sinon.stub().returns(undefined),
            getConnectionType: sinon.stub().returns('none'),
            onCredentialsDeleted: sinon.stub(),
        })
        sinon.stub(authModule, 'Auth').returns(authStub)
        baseChatStub = stubInterface<baseChatModule.BaseChat>()
        sinon.stub(baseChatModule, 'BaseChat').returns(baseChatStub)

        // Create a spy for the save text document handler
        saveTextDocumentHandlerSpy = sinon.spy()
    })

    afterEach(() => {
        sinon.restore()
    })

    it('should use the LspServer approach for all document events', () => {
        // Initialize the runtime
        standalone(props)

        // Get the features passed to the server
        const features = stubServer.getCall(0).args[0]

        // Verify that all document event handlers are using the same pattern
        // They should all be using the LspServer approach
        const openHandler = features.lsp.onDidOpenTextDocument.toString()
        const changeHandler = features.lsp.onDidChangeTextDocument.toString()
        const closeHandler = features.lsp.onDidCloseTextDocument.toString()
        const saveHandler = features.lsp.onDidSaveTextDocument.toString()

        // All handlers should be using the same pattern
        assert.strictEqual(openHandler.includes('this.didOpenTextDocumentHandler = handler'), true)
        assert.strictEqual(changeHandler.includes('this.didChangeTextDocumentHandler = handler'), true)
        assert.strictEqual(closeHandler.includes('this.didCloseTextDocumentHandler = handler'), true)
        assert.strictEqual(saveHandler.includes('this.didSaveTextDocumentHandler = handler'), true)
    })

    it('should properly route textDocument/didSave notifications through the LSP connection', () => {
        // Initialize the runtime
        standalone(props)

        // Get the features passed to the server
        const features = stubServer.getCall(0).args[0]

        // Register our spy as a save document handler
        features.lsp.onDidSaveTextDocument(saveTextDocumentHandlerSpy)

        // Create a save document event
        const saveParams: DidSaveTextDocumentParams = {
            textDocument: {
                uri: 'file:///test.txt',
                version: 2,
            },
        }

        // Get the onDidSaveTextDocument handler that was registered with the connection
        const onDidSaveTextDocumentHandler = stubConnection.onDidSaveTextDocument.getCall(0).args[0]
        assert.strictEqual(
            typeof onDidSaveTextDocumentHandler,
            'function',
            'onDidSaveTextDocument handler should be a function'
        )

        // Simulate the connection sending a textDocument/didSave notification
        onDidSaveTextDocumentHandler(saveParams)

        // Verify that our handler was called
        sinon.assert.calledOnce(saveTextDocumentHandlerSpy)
        sinon.assert.calledWithExactly(saveTextDocumentHandlerSpy, saveParams)
    })

    it('should properly route all document events through the LSP connection', () => {
        // Initialize the runtime
        standalone(props)

        // Get the features passed to the server
        const features = stubServer.getCall(0).args[0]

        // Create spies for all document event handlers
        const openTextDocumentHandlerSpy = sinon.spy()
        const changeTextDocumentHandlerSpy = sinon.spy()
        const closeTextDocumentHandlerSpy = sinon.spy()

        // Register our spies as document event handlers
        features.lsp.onDidOpenTextDocument(openTextDocumentHandlerSpy)
        features.lsp.onDidChangeTextDocument(changeTextDocumentHandlerSpy)
        features.lsp.onDidCloseTextDocument(closeTextDocumentHandlerSpy)

        // Create document event parameters
        const openParams = {
            textDocument: {
                uri: 'file:///test.txt',
                languageId: 'plaintext',
                version: 1,
                text: 'test content',
            },
        }

        const changeParams = {
            textDocument: {
                uri: 'file:///test.txt',
                version: 2,
            },
            contentChanges: [
                {
                    text: 'updated content',
                },
            ],
        }

        const closeParams = {
            textDocument: {
                uri: 'file:///test.txt',
            },
        }

        // Get the document event handlers that were registered with the connection
        const onDidOpenTextDocumentHandler = stubConnection.onDidOpenTextDocument.getCall(0).args[0]
        const onDidChangeTextDocumentHandler = stubConnection.onDidChangeTextDocument.getCall(0).args[0]
        const onDidCloseTextDocumentHandler = stubConnection.onDidCloseTextDocument.getCall(0).args[0]

        assert.strictEqual(
            typeof onDidOpenTextDocumentHandler,
            'function',
            'onDidOpenTextDocument handler should be a function'
        )
        assert.strictEqual(
            typeof onDidChangeTextDocumentHandler,
            'function',
            'onDidChangeTextDocument handler should be a function'
        )
        assert.strictEqual(
            typeof onDidCloseTextDocumentHandler,
            'function',
            'onDidCloseTextDocument handler should be a function'
        )

        // Simulate the connection sending document notifications
        onDidOpenTextDocumentHandler(openParams)
        onDidChangeTextDocumentHandler(changeParams)
        onDidCloseTextDocumentHandler(closeParams)

        // Verify that our handlers were called
        sinon.assert.calledOnce(openTextDocumentHandlerSpy)
        sinon.assert.calledWithExactly(openTextDocumentHandlerSpy, openParams)

        sinon.assert.calledOnce(changeTextDocumentHandlerSpy)
        sinon.assert.calledWithExactly(changeTextDocumentHandlerSpy, changeParams)

        sinon.assert.calledOnce(closeTextDocumentHandlerSpy)
        sinon.assert.calledWithExactly(closeTextDocumentHandlerSpy, closeParams)
    })
})
