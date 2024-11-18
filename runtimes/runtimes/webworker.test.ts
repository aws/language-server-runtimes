import sinon from 'sinon'
import { RuntimeProps } from './runtime'
import * as vscodeLanguageServer from 'vscode-languageserver/node'
import { createStubFromInterface } from './util/testingUtils'
import assert from 'assert'
import proxyquire from 'proxyquire'
import { Features } from '../server-interface/server'

describe('webworker', () => {
    let stubServer: sinon.SinonStub
    let props: RuntimeProps
    let stubConnection: sinon.SinonStubbedInstance<vscodeLanguageServer.Connection> & vscodeLanguageServer.Connection
    let webworker: (props: RuntimeProps) => void

    beforeEach(() => {
        stubServer = sinon.stub()
        props = {
            version: '0.1.0',
            servers: [stubServer],
            name: 'Test',
        }
        stubConnection = createStubFromInterface<vscodeLanguageServer.Connection>()
        stubConnection.console = createStubFromInterface<vscodeLanguageServer.RemoteConsole>()
        stubConnection.telemetry = createStubFromInterface<vscodeLanguageServer.Telemetry>()
        ;(global as any).self = sinon.stub()
        ;({ webworker } = proxyquire('./webworker', {
            'vscode-languageserver/browser': {
                BrowserMessageReader: sinon.stub(),
                BrowserMessageWriter: sinon.stub(),
                createConnection: () => stubConnection,
            },
        }))
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
            features = stubServer.getCall(0).args[0] as Features
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
