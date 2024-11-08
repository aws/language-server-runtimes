import sinon from 'sinon'
import { RuntimeProps } from './runtime'
import assert from 'assert'
import { standalone } from './standalone'
import * as vscodeLanguageServer from 'vscode-languageserver/node'
import { telemetryNotificationType } from '../protocol'
import { createStubFromInterface, Features } from './util/testingUtils'
import os from 'os'
import path from 'path'
import * as lspRouterModule from './lsp/router/lspRouter'
import { LspServer } from './lsp/router/lspServer'

describe('standalone', () => {
    let stubServer: sinon.SinonStub
    let props: RuntimeProps
    let stubConnection: sinon.SinonStubbedInstance<vscodeLanguageServer.Connection> & vscodeLanguageServer.Connection
    let features: Features
    let lspRouterStub: sinon.SinonStubbedInstance<lspRouterModule.LspRouter> & lspRouterModule.LspRouter

    before(() => {
        stubServer = sinon.stub()
        props = {
            version: '0.1.0',
            servers: [stubServer],
            name: 'Test',
        }
        stubConnection = createStubFromInterface<vscodeLanguageServer.Connection>()
        stubConnection.console = createStubFromInterface<vscodeLanguageServer.RemoteConsole>()
        stubConnection.telemetry = createStubFromInterface<vscodeLanguageServer.Telemetry>()
        sinon
            .stub(vscodeLanguageServer, 'createConnection')
            .returns(stubConnection as unknown as vscodeLanguageServer._Connection)

        lspRouterStub = createStubFromInterface<lspRouterModule.LspRouter>()
        lspRouterStub.servers = createStubFromInterface<LspServer[]>()
        sinon.stub(lspRouterModule, 'LspRouter').returns(lspRouterStub)

        standalone(props)
        features = stubServer.getCall(0).args[0] as Features
    })

    it('should initialize lsp connection and start listening', () => {
        sinon.assert.calledOnce(lspRouterStub.servers.push as sinon.SinonStub)
        sinon.assert.calledOnce(stubConnection.listen)
    })

    describe('features', () => {
        beforeEach(() => {
            sinon.resetHistory()
        })

        describe('Workspace', () => {
            describe('fs.getTempDirPath', () => {
                it('should return the correct tmp directory path on Darwin', () => {
                    sinon.stub(os, 'type').returns('Darwin')

                    const result = features.workspace.fs.getTempDirPath()
                    const expected = path.join('/tmp', 'aws-language-servers')

                    assert.strictEqual(result, expected)
                })
            })
        })

        describe('Telemetry', () => {
            describe('emitMetric', () => {
                it('should use LSP connection telemetry log event', () => {
                    let metric: any
                    features.telemetry.emitMetric(metric)
                    sinon.assert.calledOnceWithExactly(stubConnection.telemetry.logEvent as sinon.SinonStub, metric)
                })
            })
            describe('onClientTelemetry', () => {
                it('should use LSP onNotification', () => {
                    let handler: any
                    features.telemetry.onClientTelemetry(handler)
                    sinon.assert.calledOnceWithExactly(
                        stubConnection.onNotification as sinon.SinonStub,
                        telemetryNotificationType.method,
                        handler
                    )
                })
            })
        })

        describe('Logging', () => {
            it('should use LSP connection logging console', () => {
                features.logging.log('info')
                sinon.assert.calledOnce(stubConnection.console.info as sinon.SinonStub)
            })
        })

        describe('Runtime', () => {
            it('should have the right params', () => {
                assert.strictEqual(features.runtime.serverInfo.name, props.name)
                assert.strictEqual(features.runtime.serverInfo.version, props.version)
            })
        })
    })
})
