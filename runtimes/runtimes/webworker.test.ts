import sinon, { stubInterface } from 'ts-sinon'
import { RuntimeProps } from './runtime'
import * as vscodeLanguageServer from 'vscode-languageserver/node'
import assert from 'assert'
import { Features } from '../server-interface/server'
import * as browserModule from 'vscode-languageserver/browser'

describe('webworker', () => {
    let stubServer: sinon.SinonStub
    let props: RuntimeProps
    let stubConnection: sinon.SinonStubbedInstance<vscodeLanguageServer.Connection> & vscodeLanguageServer.Connection
    let webworker: (props: RuntimeProps) => void
    let mockReader: any
    let mockWriter: any

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
        stubConnection.workspace = stubInterface<vscodeLanguageServer.RemoteWorkspace>()

        // Set up global self for webworker environment
        const mockSelf = {
            postMessage: sinon.stub(),
            onmessage: null,
            addEventListener: sinon.stub(),
            removeEventListener: sinon.stub(),
        } as any
        ;(global as any).self = mockSelf

        // Mock the browser message reader/writer instances
        mockReader = stubInterface()
        mockWriter = stubInterface()

        // Stub the constructors to return our mocked instances
        sinon.stub(browserModule, 'BrowserMessageReader').returns(mockReader)
        sinon.stub(browserModule, 'BrowserMessageWriter').returns(mockWriter)

        // Most importantly, mock createConnection to return our stubbed connection
        sinon.stub(browserModule, 'createConnection').returns(stubConnection)

        // Now import the actual webworker module - the stubs will be used when it constructs reader/writer/connection
        const webworkerModule = require('./webworker')
        webworker = webworkerModule.webworker
    })

    afterEach(() => {
        sinon.restore()
        delete (global as any).self
    })

    it('should initialize lsp connection and start listening', () => {
        webworker(props)
        sinon.assert.calledOnce(stubConnection.listen)
    })

    describe('features', () => {
        let features: Features

        beforeEach(() => {
            webworker(props)
            features = stubServer.getCall(0).args[0]
        })

        describe('Runtime', () => {
            it('should set params from runtime properties', () => {
                assert.strictEqual(features.runtime.serverInfo.name, props.name)
                assert.strictEqual(features.runtime.serverInfo.version, props.version)
                assert.strictEqual(features.runtime.platform, 'browser')
            })
        })
    })
})
