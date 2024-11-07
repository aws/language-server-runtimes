import sinon from 'sinon'
import { RuntimeProps } from './runtime'
import { standalone } from './standalone'
import * as vscodeLanguageserver from 'vscode-languageserver/node'

import { createStubFromInterface, Features } from './util/testingUtils'
import assert from 'assert'

describe('webworker', () => {
    let stubServer: sinon.SinonStub
    let props: RuntimeProps
    let stubConnection: sinon.SinonStubbedInstance<vscodeLanguageserver.Connection> & vscodeLanguageserver.Connection
    let features: Features

    before(() => {
        stubServer = sinon.stub()
        props = {
            version: '0.1.0',
            servers: [stubServer],
            name: 'Test',
        }
        stubConnection = createStubFromInterface<vscodeLanguageserver.Connection>()
        stubConnection.console = createStubFromInterface<vscodeLanguageserver.RemoteConsole>()
        stubConnection.telemetry = createStubFromInterface<vscodeLanguageserver.Telemetry>()
        sinon
            .stub(vscodeLanguageserver, 'createConnection')
            .returns(stubConnection as unknown as vscodeLanguageserver._Connection)
        standalone(props)
        features = stubServer.getCall(0).args[0] as Features
    })

    it('should initialize lsp connection and start listening', () => {
        sinon.assert.calledOnce(stubConnection.listen)
        sinon.assert.calledOnceWithExactly(stubServer, features)
    })

    describe('features', () => {
        beforeEach(() => {
            sinon.resetHistory()
        })

        describe('Runtime', () => {
            it('should have the right params', () => {
                assert.strictEqual(features.runtime.serverInfo.name, props.name)
                assert.strictEqual(features.runtime.serverInfo.version, props.version)
            })
        })
    })
})
