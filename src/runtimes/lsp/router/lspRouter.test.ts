import {
    CancellationToken,
    InitializeParams,
    InitializeError,
    RequestHandler,
    TextDocumentSyncKind,
} from '../../../protocol'
import { Connection } from 'vscode-languageserver/node'
import { LspRouter } from './lspRouter'
import assert from 'assert'
import sinon from 'sinon'
import { PartialInitializeResult } from '../../../server-interface/lsp'

describe('initialize', () => {
    const sandbox = sinon.createSandbox()

    const lspConnection = <Connection>{
        onInitialize: (handler: any) => {},
        onExecuteCommand: (handler: any) => {},
    }
    let initializeHandler: RequestHandler<InitializeParams, PartialInitializeResult, InitializeError>

    let lspRouter: LspRouter

    beforeEach(() => {
        const onInitializeSpy = sandbox.spy(lspConnection, 'onInitialize')

        lspRouter = new LspRouter(lspConnection, 'AWS LSP Standalone', '1.0.0')

        initializeHandler = onInitializeSpy.getCall(0).args[0] as RequestHandler<
            InitializeParams,
            PartialInitializeResult,
            InitializeError
        >
    })

    afterEach(function () {
        sandbox.restore()
    })

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

    // TODO: other tests
})
