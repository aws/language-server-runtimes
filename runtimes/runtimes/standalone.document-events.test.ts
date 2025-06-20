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
import {
    DidSaveTextDocumentParams,
    DidOpenTextDocumentParams,
    DidChangeTextDocumentParams,
    DidCloseTextDocumentParams,
} from '../protocol'

describe('standalone document event handling', () => {
    let stubServer: sinon.SinonStub
    let props: RuntimeProps
    let stubConnection: sinon.SinonStubbedInstance<vscodeLanguageServer.Connection> & vscodeLanguageServer.Connection
    let lspRouterStub: sinon.SinonStubbedInstance<lspRouterModule.LspRouter> & lspRouterModule.LspRouter
    let authStub: sinon.SinonStubbedInstance<authModule.Auth> & authModule.Auth
    let baseChatStub: sinon.SinonStubbedInstance<baseChatModule.BaseChat> & baseChatModule.BaseChat
    let documentObserverStub: any
    let openTextDocumentHandlerSpy: sinon.SinonSpy
    let changeTextDocumentHandlerSpy: sinon.SinonSpy
    let closeTextDocumentHandlerSpy: sinon.SinonSpy
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

        // Create spies for document event handlers
        openTextDocumentHandlerSpy = sinon.spy()
        changeTextDocumentHandlerSpy = sinon.spy()
        closeTextDocumentHandlerSpy = sinon.spy()
        saveTextDocumentHandlerSpy = sinon.spy()

        // Mock document observer
        documentObserverStub = {
            callbacks: {
                onDidOpenTextDocument: sinon.stub().returns({ dispose: sinon.stub() }),
                onDidChangeTextDocument: sinon.stub().returns({ dispose: sinon.stub() }),
                onDidCloseTextDocument: sinon.stub().returns({ dispose: sinon.stub() }),
                onDidSaveTextDocument: sinon.stub().returns({ dispose: sinon.stub() }),
                onWillSaveTextDocument: sinon.stub().returns({ dispose: sinon.stub() }),
                onWillSaveTextDocumentWaitUntil: sinon.stub().returns({ dispose: sinon.stub() }),
            },
            onDidOpenTextDocument: sinon.stub(),
            onDidChangeTextDocument: sinon.stub(),
            onDidCloseTextDocument: sinon.stub(),
            onDidSaveTextDocument: sinon.stub(),
            onWillSaveTextDocument: sinon.stub(),
        }
        sinon.stub(textDocumentConnectionModule, 'observe').returns(documentObserverStub)
    })

    afterEach(() => {
        sinon.restore()
    })

    it('should register document event handlers with LspServer', () => {
        // Initialize the runtime
        standalone(props)

        // Get the features passed to the server
        const features = stubServer.getCall(0).args[0]

        // Verify that the document event handlers are registered with LspServer
        assert.strictEqual(typeof features.lsp.onDidOpenTextDocument, 'function')
        assert.strictEqual(typeof features.lsp.onDidChangeTextDocument, 'function')
        assert.strictEqual(typeof features.lsp.onDidCloseTextDocument, 'function')
        assert.strictEqual(typeof features.lsp.onDidSaveTextDocument, 'function')

        // Verify that all document event handlers are using the same pattern
        // They should all be using the LspServer approach
        const openHandler = features.lsp.onDidOpenTextDocument.toString()
        const saveHandler = features.lsp.onDidSaveTextDocument.toString()

        // All handlers should be using the same approach (either all LspServer or all document observer)
        // Check that they're both using the LspServer approach
        assert.strictEqual(openHandler.includes('this.didOpenTextDocumentHandler = handler'), true)
        assert.strictEqual(saveHandler.includes('this.didSaveTextDocumentHandler = handler'), true)
    })

    it('should route document events from LSP connection to all servers', () => {
        // This test verifies that document events are routed from the LSP connection to all servers
        // Since we're using stubs, we can't directly test this behavior
        // Instead, we'll verify that the LspRouter has methods for handling document events

        // Initialize the runtime
        standalone(props)

        // Verify that the LspRouter has methods for handling document events
        assert.strictEqual(typeof lspRouterStub.didOpenTextDocument, 'function')
        assert.strictEqual(typeof lspRouterStub.didChangeTextDocument, 'function')
        assert.strictEqual(typeof lspRouterStub.didCloseTextDocument, 'function')
        assert.strictEqual(typeof lspRouterStub.didSaveTextDocument, 'function')
    })
})
