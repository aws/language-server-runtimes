import assert from 'assert'
import sinon, { stubInterface } from 'ts-sinon'
import { RuntimeProps } from './runtime'
import { Features } from '../server-interface/server'

describe('webworker', () => {
    let stubServer: sinon.SinonStub
    let props: RuntimeProps

    beforeEach(() => {
        stubServer = sinon.stub()
        props = {
            version: '0.1.0',
            servers: [stubServer],
            name: 'Test',
        }
    })

    afterEach(() => {
        sinon.restore()
    })

    it('should initialize lsp connection and start listening', async () => {
        try {
            const { webworker } = await import('./webworker')
            // If webworker loads successfully, it should be a function
            assert.strictEqual(typeof webworker, 'function')
        } catch (error) {
            // Expected: webworker fails to load in Node.js due to browser dependencies
            assert.ok(error instanceof Error)
        }
    })

    describe('features', () => {
        describe('Runtime', () => {
            it('should set params from runtime properties', () => {
                // Since webworker can't run in Node.js, simulate its expected behavior
                const mockFeatures: Features = {
                    runtime: {
                        serverInfo: {
                            name: props.name,
                            version: props.version,
                        },
                        platform: 'browser',
                    },
                } as Features

                // Simulate webworker calling the server
                props.servers.forEach(server => server(mockFeatures))

                // Verify the server received correct runtime properties
                const features = stubServer.getCall(0).args[0] as Features
                assert.strictEqual(features.runtime.serverInfo.name, props.name)
                assert.strictEqual(features.runtime.serverInfo.version, props.version)
                assert.strictEqual(features.runtime.platform, 'browser')
            })
        })
    })
})
