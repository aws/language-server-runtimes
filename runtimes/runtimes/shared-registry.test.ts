import { SharedRegistry } from '../server-interface'
import { newSharedRegistry } from './shared-registry'
import { deepStrictEqual, strictEqual, rejects } from 'assert'
import sinon from 'ts-sinon'

describe('newSharedRegistry', () => {
    let sharedRegistry: SharedRegistry
    let someHandler: sinon.SinonStub

    const SOME_RESULT = 'some-result'

    const registerSomeHandlers = () => {
        const handlers = [sinon.stub(), sinon.stub()]
        const out = {
            handlers,
            names: handlers.map((_handler, index) => `some-handler-${index}`),
        }

        out.handlers.forEach((handler, index) => {
            sharedRegistry.registerHandler(out.names[index], handler)
        })

        return out
    }

    beforeEach(() => {
        sharedRegistry = newSharedRegistry()
        someHandler = sinon.stub().resolves(SOME_RESULT)
    })

    it('should initialize without any registered handlers', () => {
        deepStrictEqual(sharedRegistry.listHandlers(), [])
    })

    it('should add handlers to the registry', () => {
        const { names } = registerSomeHandlers()

        deepStrictEqual(sharedRegistry.listHandlers(), names)
    })

    it('should invoke registered handler with input if provided', async () => {
        sharedRegistry.registerHandler('some-handler', someHandler)

        const firstResult = await sharedRegistry.invokeHandler('some-handler')
        sinon.assert.calledOnceWithExactly(someHandler, undefined)
        strictEqual(firstResult, SOME_RESULT)

        someHandler.resetHistory()

        const secondResult = await sharedRegistry.invokeHandler('some-handler', 'some-input')
        sinon.assert.calledOnceWithExactly(someHandler, 'some-input')
        strictEqual(secondResult, SOME_RESULT)
    })

    it('should invoke only the requested handler if multiple are defined', async () => {
        const { handlers, names } = registerSomeHandlers()
        const indexOfHandlerToInvoke = 0

        await sharedRegistry.invokeHandler(names[indexOfHandlerToInvoke])

        handlers.forEach((handler, index) => {
            if (index === indexOfHandlerToInvoke) {
                sinon.assert.calledOnce(handler)
            } else {
                sinon.assert.neverCalledWith(handler)
            }
        })
    })

    it('should throw an error if handler is not found', async () => {
        deepStrictEqual(sharedRegistry.listHandlers(), [])
        rejects(async () => await sharedRegistry.invokeHandler('some-handler', 'some-input'), Error)
    })

    it('should throw an error if handler is not found even when other handlers exist', async () => {
        const { handlers, names } = registerSomeHandlers()
        deepStrictEqual(sharedRegistry.listHandlers(), names)

        rejects(async () => await sharedRegistry.invokeHandler('some-non-existent-handler', 'some-input'), Error)
        handlers.forEach(handler => sinon.assert.neverCalledWith(handler))
    })
})
