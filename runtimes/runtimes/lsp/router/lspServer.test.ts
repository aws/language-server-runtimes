import { LspServer } from './lspServer'
import {
    CancellationToken,
    DidChangeConfigurationParams,
    ExecuteCommandParams,
    GetConfigurationFromServerParams,
    InitializeError,
    InitializedParams,
    NotificationFollowupParams,
    NotificationParams,
    ResponseError,
    showNotificationRequestType,
} from '../../../protocol'
import { Connection } from 'vscode-languageserver/node'
import { InitializeParams, PartialInitializeResult } from '../../../server-interface/lsp'
import { Logging } from '../../../server-interface'
import { Encoding } from '../../encoding'
import assert from 'assert'
import sinon from 'sinon'

describe('LspServer', () => {
    let lspServer: LspServer
    let mockConnection: sinon.SinonStubbedInstance<Connection>
    let mockEncoding: Encoding
    let mockLogger: Logging
    let sandbox: sinon.SinonSandbox
    let mockToken: CancellationToken

    beforeEach(() => {
        sandbox = sinon.createSandbox()

        mockConnection = {
            telemetry: {
                logEvent: sandbox.stub(),
            },
            sendNotification: sandbox.stub(),
        } as any

        mockEncoding = {
            encode: (value: string) => value,
            decode: (value: string) => value,
        }

        mockLogger = {
            log: sandbox.stub(),
        } as unknown as Logging

        lspServer = new LspServer(mockConnection as unknown as Connection, mockEncoding, mockLogger)

        mockToken = { isCancellationRequested: false } as unknown as CancellationToken
    })

    afterEach(() => {
        sandbox.restore()
    })

    describe('initialize', () => {
        it('should handle successful initialization', async () => {
            const params: InitializeParams = {
                processId: null,
                rootUri: null,
                capabilities: {},
                initializationOptions: {
                    aws: {
                        awsClientCapabilities: {
                            window: { notifications: true },
                        },
                    },
                },
            }

            const expectedResult: PartialInitializeResult = {
                capabilities: {},
                serverInfo: {
                    name: 'testServer',
                },
            }

            lspServer.setInitializeHandler(() => expectedResult)

            const result = await lspServer.initialize(params, mockToken)

            assert.deepStrictEqual(result, expectedResult)
            sinon.assert.notCalled(
                // @ts-ignore
                mockConnection.telemetry.logEvent
            )
            sinon.assert.notCalled(
                // @ts-ignore
                mockLogger.log
            )
        })

        it('should handle initialization errors', async () => {
            const params: InitializeParams = {
                processId: null,
                rootUri: null,
                capabilities: {},
                initializationOptions: {
                    aws: {},
                },
            }

            lspServer.setInitializeHandler(() => {
                throw new Error('Test error')
            })

            const result = await lspServer.initialize(params, mockToken)

            assert(result instanceof ResponseError)
            sinon.assert.calledWithMatch(
                // @ts-ignore
                mockLogger.log,
                'Runtime Initialization Error\nInitializationOptions: {\"aws\":{}}\nError: Test error'
            )
        })
    })

    describe('executeCommand', () => {
        it('should handle execute command when supported', async () => {
            const commandParams: ExecuteCommandParams = {
                command: 'testCommand',
                arguments: [],
            }

            lspServer['initializeResult'] = {
                capabilities: {
                    executeCommandProvider: {
                        commands: ['testCommand'],
                    },
                },
            }

            const expectedResult = { success: true }
            lspServer.setExecuteCommandHandler(() => expectedResult)

            const [handled, result] = await lspServer.tryExecuteCommand(commandParams, mockToken)

            assert.strictEqual(handled, true)
            assert.deepStrictEqual(result, expectedResult)
        })

        it('should not handle unsupported commands', async () => {
            const commandParams: ExecuteCommandParams = {
                command: 'unsupportedCommand',
                arguments: [],
            }

            lspServer['initializeResult'] = {
                capabilities: {
                    executeCommandProvider: {
                        commands: ['testCommand'],
                    },
                },
            }

            const [handled, result] = await lspServer.tryExecuteCommand(commandParams, mockToken)

            assert.strictEqual(handled, false)
            assert.strictEqual(result, undefined)
        })
    })

    describe('notification', () => {
        it('should handle notification followup', () => {
            const followupHandler = sandbox.stub()
            const params: NotificationFollowupParams = {
                source: {
                    id: 'test-id',
                },
                action: 'Acknowledge',
            }

            lspServer['notificationRouter'] = {
                processFollowup: sandbox.stub(),
            } as any

            lspServer.notification.onNotificationFollowup(followupHandler)
            lspServer.sendNotificationFollowup(params)

            sinon.assert.calledOnce(
                // @ts-ignore
                lspServer['notificationRouter']?.processFollowup
            )
        })

        it('should handle show notification when supported', () => {
            const params: NotificationParams = {
                type: 1,
                content: {
                    text: 'test text',
                },
            }

            lspServer['clientSupportsNotifications'] = true
            lspServer['notificationRouter'] = {
                send: sandbox.stub(),
            } as any

            lspServer.notification.showNotification(params)

            sinon.assert.calledOnce(
                // @ts-ignore
                lspServer['notificationRouter']?.send
            )
        })
    })

    describe('configuration', () => {
        it('should handle configuration changes', () => {
            const configHandler = sandbox.stub()
            const params: DidChangeConfigurationParams = {
                settings: {},
            }

            lspServer.setDidChangeConfigurationHandler(configHandler)
            lspServer.sendDidChangeConfigurationNotification(params)

            assert(configHandler.calledOnce)
            assert(configHandler.calledWith(params))
        })

        it('should handle server configuration requests', async () => {
            const params: GetConfigurationFromServerParams = {
                section: 'testSection',
            }

            lspServer['initializeResult'] = {
                awsServerCapabilities: {
                    configurationProvider: {
                        sections: ['testSection'],
                    },
                },
                capabilities: {
                    executeCommandProvider: { commands: ['run'] },
                },
            }

            const expectedResult = { setting: 'value' }
            lspServer.setServerConfigurationHandler(() => expectedResult)

            const [handled, result] = await lspServer.tryGetServerConfiguration(params, mockToken)

            assert.strictEqual(handled, true)
            assert.deepStrictEqual(result, expectedResult)
        })
    })
})
