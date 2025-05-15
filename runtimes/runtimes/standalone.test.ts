import sinon, { stubInterface } from 'ts-sinon'
import { RuntimeProps } from './runtime'
import assert from 'assert'
import { standalone } from './standalone'
import * as vscodeLanguageServer from 'vscode-languageserver/node'
import os from 'os'
import path from 'path'
import * as lspRouterModule from './lsp/router/lspRouter'
import { LspServer } from './lsp/router/lspServer'
import { Features } from '../server-interface/server'
import * as authEncryptionModule from './auth/standalone/encryption'
import * as authModule from './auth/auth'
import * as encryptedChatModule from './chat/encryptedChat'
import * as baseChatModule from './chat/baseChat'
import { pathToFileURL } from 'url'

describe('standalone', () => {
    let stubServer: sinon.SinonStub
    let props: RuntimeProps
    let stubConnection: sinon.SinonStubbedInstance<vscodeLanguageServer.Connection> & vscodeLanguageServer.Connection
    let lspRouterStub: sinon.SinonStubbedInstance<lspRouterModule.LspRouter> & lspRouterModule.LspRouter

    beforeEach(() => {
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
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('initializeAuth', () => {
        let authStub: sinon.SinonStubbedInstance<authModule.Auth> & authModule.Auth
        let chatStub: sinon.SinonStubbedInstance<encryptedChatModule.EncryptedChat> & encryptedChatModule.EncryptedChat
        let baseChatStub: sinon.SinonStubbedInstance<baseChatModule.BaseChat> & baseChatModule.BaseChat

        it('should initialize without encryption when no key is present', () => {
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

            standalone(props)

            sinon.assert.calledWithExactly(authModule.Auth as unknown as sinon.SinonStub, stubConnection, lspRouterStub)
            sinon.assert.calledWithExactly(
                stubConnection.console.info as sinon.SinonStub,
                'Runtime: Initializing runtime without encryption'
            )
            sinon.assert.calledWithExactly(baseChatModule.BaseChat as unknown as sinon.SinonStub, stubConnection)
            sinon.assert.calledThrice(lspRouterStub.servers.push as sinon.SinonStub)
            sinon.assert.calledOnce(stubConnection.listen)
        })

        it('should initialize with encryption when a key is provided', async () => {
            sinon.stub(authEncryptionModule, 'shouldWaitForEncryptionKey').returns(true)
            const encryptionInitialization: authEncryptionModule.EncryptionInitialization = {
                version: '1.0',
                mode: 'JWT',
                key: 'encryption_key',
            }
            sinon
                .stub(authEncryptionModule, 'readEncryptionDetails')
                .returns(
                    new Promise<authEncryptionModule.EncryptionInitialization>((resolve, _) =>
                        resolve(encryptionInitialization)
                    )
                )
            authStub = stubInterface<authModule.Auth>()
            authStub.getCredentialsProvider.returns({
                hasCredentials: sinon.stub().returns(false),
                getCredentials: sinon.stub().returns(undefined),
                getConnectionMetadata: sinon.stub().returns(undefined),
                getConnectionType: sinon.stub().returns('none'),
                onCredentialsDeleted: sinon.stub(),
            })
            sinon.stub(authModule, 'Auth').returns(authStub)
            chatStub = stubInterface<encryptedChatModule.EncryptedChat>()
            sinon.stub(encryptedChatModule, 'EncryptedChat').returns(chatStub)

            await standalone(props)

            sinon.assert.calledWithExactly(
                stubConnection.console.info as sinon.SinonStub,
                'Runtime: Initializing runtime with encryption'
            )
            sinon.assert.calledWithExactly(
                authModule.Auth as unknown as sinon.SinonStub,
                stubConnection,
                lspRouterStub,
                encryptionInitialization.key,
                encryptionInitialization.mode
            )
            sinon.assert.calledWithExactly(
                encryptedChatModule.EncryptedChat as unknown as sinon.SinonStub,
                stubConnection,
                encryptionInitialization.key,
                encryptionInitialization.mode
            )
            sinon.assert.calledThrice(lspRouterStub.servers.push as sinon.SinonStub)
            sinon.assert.calledOnce(stubConnection.listen)
        })
    })

    describe('features', () => {
        let features: Features

        beforeEach(() => {
            standalone(props)
            features = stubServer.getCall(0).args[0]
        })

        describe('Workspace', () => {
            describe('fs.getTempDirPath', () => {
                it('should use /tmp path when on Darwin', () => {
                    sinon.stub(os, 'type').returns('Darwin')
                    const expected = path.join('/tmp', 'aws-language-servers')

                    const result = features.workspace.fs.getTempDirPath()

                    assert.strictEqual(result, expected)
                })

                it('should use os.tmpdir() path when on non-Darwin systems', () => {
                    sinon.stub(os, 'type').returns('Linux')
                    sinon.stub(os, 'tmpdir').returns('/test-tmp')
                    const expected = path.join('/test-tmp', 'aws-language-servers')

                    const result = features.workspace.fs.getTempDirPath()

                    assert.strictEqual(result, expected)
                })
            })

            describe('getWorkspaceFolder', () => {
                it('should return undefined when no workspace folders are configured', () => {
                    const fileUri = pathToFileURL('/sample/files').href
                    const result = features.workspace.getWorkspaceFolder(fileUri)

                    assert.strictEqual(result, undefined)
                })

                it('should return undefined when workspace folders are empty', () => {
                    const fileUri = pathToFileURL('/sample/files').href
                    lspRouterStub.getAllWorkspaceFolders = sinon.stub().returns([]) as sinon.SinonStub<
                        [],
                        vscodeLanguageServer.WorkspaceFolder[]
                    >

                    const result = features.workspace.getWorkspaceFolder(fileUri)

                    assert.strictEqual(result, undefined)
                })

                it('should return the workspace folder that contains the given file path', () => {
                    const fileUri = pathToFileURL('/sample/workspace/file.ts').href
                    let workspaceFolders = [
                        { name: 'folder1', uri: '/folder/workspace' },
                        { name: 'name', uri: '/tmp/tmp' },
                        { name: 'name1', uri: '/sample/workspace/folder' },
                        { name: 'workspace', uri: '/sample/workspace' },
                        { name: 'name2', uri: '/sample' },
                    ]
                    workspaceFolders = workspaceFolders.map(folder => ({
                        name: folder.name,
                        uri: pathToFileURL(folder.uri).href,
                    }))
                    // @ts-ignore
                    lspRouterStub.getAllWorkspaceFolders = sinon.stub().returns(workspaceFolders)

                    const result = features.workspace.getWorkspaceFolder(fileUri)

                    assert.strictEqual(result, workspaceFolders[3])
                })
            })

            describe('getAllWorkspaceFolders', () => {
                it('should return workspace folders when configured', () => {
                    let workspaceFolders = [
                        { name: 'folder1', uri: '/folder/workspace' },
                        { name: 'name', uri: '/tmp/tmp' },
                        { name: 'name1', uri: '/sample/workspace/folder' },
                        { name: 'workspace', uri: '/sample/workspace' },
                        { name: 'name2', uri: '/sample' },
                    ]
                    workspaceFolders = workspaceFolders.map(folder => ({
                        name: folder.name,
                        uri: pathToFileURL(folder.uri).href,
                    }))
                    // @ts-ignore
                    lspRouterStub.getAllWorkspaceFolders = sinon.stub().returns(workspaceFolders)
                    const result = features.workspace.getAllWorkspaceFolders()

                    assert.strictEqual(result, workspaceFolders)
                })
            })
        })

        describe('Runtime', () => {
            it('should set params from runtime properties', () => {
                assert.strictEqual(features.runtime.serverInfo.name, props.name)
                assert.strictEqual(features.runtime.serverInfo.version, props.version)
            })
        })
    })
})
