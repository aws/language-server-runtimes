import {
    CancellationToken,
    InitializeParams,
    InitializeError,
    RequestHandler,
    TextDocumentSyncKind,
    InitializeResult,
    ResponseError,
    ExecuteCommandParams,
} from '../../../protocol'
import { Connection } from 'vscode-languageserver/node'
import { LspRouter } from './lspRouter'
import assert from 'assert'
import sinon from 'sinon'
import { PartialInitializeResult } from '../../../server-interface/lsp'
import { LspServer } from './lspServer'

describe('LspRouter', () => {
    const sandbox = sinon.createSandbox()

    const lspConnection = <Connection>{
        onInitialize: (handler: any) => {},
        onExecuteCommand: (handler: any) => {},
    }
    let initializeHandler: RequestHandler<InitializeParams, PartialInitializeResult, InitializeError>
    let executeCommandHandler: RequestHandler<ExecuteCommandParams, any | undefined | null, void>

    let lspRouter: LspRouter

    beforeEach(() => {
        const onInitializeSpy = sandbox.spy(lspConnection, 'onInitialize')
        const onExecuteommandSpy = sandbox.spy(lspConnection, 'onExecuteCommand')

        lspRouter = new LspRouter(lspConnection, 'AWS LSP Standalone', '1.0.0')

        initializeHandler = onInitializeSpy.getCall(0).args[0] as RequestHandler<
            InitializeParams,
            PartialInitializeResult,
            InitializeError
        >
        executeCommandHandler = onExecuteommandSpy.getCall(0).args[0] as RequestHandler<
            ExecuteCommandParams,
            any | undefined | null,
            void
        >
    })

    afterEach(function () {
        sandbox.restore()
    })

    describe('initialize', () => {
        it('should store InitializeParam in a field', () => {
            const initParam = {} as InitializeParams
            initializeHandler(initParam, {} as CancellationToken)
            assert(lspRouter.clientInitializeParams === initParam)
        })

        it('should return the default response when no handlers are registered', async () => {
            const result = await initializeHandler({} as InitializeParams, {} as CancellationToken)

            const expected = {
                serverInfo: {
                    name: 'AWS LSP Standalone',
                    version: '1.0.0',
                },
                capabilities: {
                    textDocumentSync: {
                        openClose: true,
                        change: TextDocumentSyncKind.Incremental,
                    },
                    hoverProvider: true,
                },
            }
            assert.deepStrictEqual(result, expected)
        })

        it('should return the default response when server with no handler is registered', async () => {
            lspRouter.servers.push(newServer({}))
            const result = await initializeHandler({} as InitializeParams, {} as CancellationToken)

            const expected = {
                serverInfo: {
                    name: 'AWS LSP Standalone',
                    version: '1.0.0',
                },
                capabilities: {
                    textDocumentSync: {
                        openClose: true,
                        change: TextDocumentSyncKind.Incremental,
                    },
                    hoverProvider: true,
                },
            }
            assert.deepStrictEqual(result, expected)
        })

        it('should merge handler results with the default response', async () => {
            const handler1 = () => {
                return {
                    capabilities: {
                        completionProvider: { resolveProvider: true },
                    },
                }
            }
            const handler2 = () => {
                return Promise.resolve({
                    capabilities: {
                        hoverProvider: true,
                    },
                    extraField: 'extraValue',
                })
            }

            lspRouter.servers.push(newServer({ initializeHandler: handler1 }))
            lspRouter.servers.push(newServer({ initializeHandler: handler2 }))

            const result = await initializeHandler({} as InitializeParams, {} as CancellationToken)

            const expected: InitializeResult = {
                serverInfo: {
                    name: 'AWS LSP Standalone',
                    version: '1.0.0',
                },
                capabilities: {
                    textDocumentSync: {
                        openClose: true,
                        change: TextDocumentSyncKind.Incremental,
                    },
                    completionProvider: { resolveProvider: true },
                    hoverProvider: true,
                },
                extraField: 'extraValue',
            }

            assert.deepStrictEqual(result, expected)
        })

        it('should prioritize the response of the handler that comes first', async () => {
            const handler1 = () => {
                return {
                    capabilities: {
                        completionProvider: { resolveProvider: true },
                    },
                }
            }
            const handler2 = () => {
                return Promise.resolve({
                    capabilities: {
                        completionProvider: { resolveProvider: false },
                    },
                })
            }

            lspRouter.servers.push(newServer({ initializeHandler: handler1 }))
            lspRouter.servers.push(newServer({ initializeHandler: handler2 }))

            const result = await initializeHandler({} as InitializeParams, {} as CancellationToken)

            const expected: InitializeResult = {
                serverInfo: {
                    name: 'AWS LSP Standalone',
                    version: '1.0.0',
                },
                capabilities: {
                    textDocumentSync: {
                        openClose: true,
                        change: TextDocumentSyncKind.Incremental,
                    },
                    completionProvider: { resolveProvider: true },
                    hoverProvider: true,
                },
            }

            assert.deepStrictEqual(result, expected)
        })

        it('should return error if any of the handlers failed', async () => {
            const handler1 = () => {
                return {
                    capabilities: {
                        completionProvider: { resolveProvider: true },
                    },
                }
            }
            const error = new ResponseError(111, 'failed', { retry: false })
            const handler2 = (): Promise<ResponseError<InitializeError>> => {
                return Promise.resolve(error)
            }

            lspRouter.servers.push(newServer({ initializeHandler: handler1 }))
            lspRouter.servers.push(newServer({ initializeHandler: handler2 }))

            const result = await initializeHandler({} as InitializeParams, {} as CancellationToken)

            assert.deepStrictEqual(result, error)
        })
    })

    describe('executeCommand', () => {
        it('should prioritize the command of the server that comes first', async () => {
            const initHandler1 = () => {
                return {
                    capabilities: {
                        executeCommandProvider: { commands: [] },
                    },
                }
            }
            const initHandler2 = () => {
                return {
                    capabilities: {
                        executeCommandProvider: { commands: ['log', 'test'] },
                    },
                }
            }
            const initHandler3 = () => {
                return {
                    capabilities: {
                        executeCommandProvider: { commands: ['test'] },
                    },
                }
            }

            const servers = [
                newServer({ initializeHandler: initHandler1, executeCommandHandler: () => 'server1' }),
                newServer({ initializeHandler: initHandler2, executeCommandHandler: () => 'server2' }),
                newServer({ initializeHandler: initHandler3, executeCommandHandler: () => 'server3' }),
            ]

            for (const server of servers) {
                lspRouter.servers.push(server)
                await server.initialize({} as InitializeParams, {} as CancellationToken)
            }

            const result = await executeCommandHandler(
                { command: 'test' } as ExecuteCommandParams,
                {} as CancellationToken
            )

            assert.equal(result, 'server2')
        })
    })

    function newServer({
        initializeHandler,
        executeCommandHandler,
    }: {
        initializeHandler?: any
        executeCommandHandler?: any
    }) {
        const server = new LspServer()
        server.setInitializeHandler(initializeHandler)
        server.setExecuteCommandHandler(executeCommandHandler)
        return server
    }
})
