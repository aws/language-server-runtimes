import sinon from 'ts-sinon'
import { Features } from '../../server-interface/server'
import { RuntimeProps } from '../runtime'
import { deepStrictEqual, doesNotReject } from 'assert'

export const generateSharedRegistryFeatureTest = (runtime: (props: RuntimeProps) => void) => {
    describe('SharedRegistry', () => {
        let firstServer: sinon.SinonStub
        let secondServer: sinon.SinonStub

        let firstFeatures: Features
        let secondFeatures: Features

        beforeEach(() => {
            firstServer = sinon.stub()
            secondServer = sinon.stub()

            const props: RuntimeProps = {
                version: '0.1.0',
                servers: [firstServer, secondServer],
                name: 'Test',
            }

            runtime(props)

            firstFeatures = firstServer.getCall(0).args[0]
            secondFeatures = secondServer.getCall(0).args[0]
        })

        it('should have the same instance for each server', () => {
            deepStrictEqual(firstFeatures.sharedRegistry, secondFeatures.sharedRegistry)
        })

        it('should allow a server to invoke a handler registered by another server', () => {
            const someHandler = sinon.stub()
            firstFeatures.sharedRegistry.registerHandler('some-handler', someHandler)

            doesNotReject(async () => await secondFeatures.sharedRegistry.invokeHandler('some-handler'))
            sinon.assert.calledOnce(someHandler)
        })
    })
}
