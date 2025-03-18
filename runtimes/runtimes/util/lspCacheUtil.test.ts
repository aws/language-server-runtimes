import { StubbedInstance, stubInterface } from 'ts-sinon'
import assert from 'assert'
import { LspRouter } from '../lsp/router/lspRouter'
import { InitializeParams } from '../../protocol'
import { getClientInitializeParamsHandlerFactory } from './lspCacheUtil'

describe('getClientInitializeParamsFactory', () => {
    let lspRouterStub: StubbedInstance<LspRouter>

    beforeEach(() => {
        lspRouterStub = stubInterface<LspRouter>()
    })

    it('returns the client params of the passed lsp router', () => {
        const expected: InitializeParams = { processId: 0, rootUri: 'some-root-uri', capabilities: {} }
        lspRouterStub.clientInitializeParams = expected

        const handler = getClientInitializeParamsHandlerFactory(lspRouterStub)

        assert.deepStrictEqual(handler(), expected)
    })
})
