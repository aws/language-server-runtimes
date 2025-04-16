import sinon from 'sinon'
import { OperationalTelemetryService } from './operational-telemetry-service'
import { NodeSDK } from '@opentelemetry/sdk-node'
import assert from 'assert'

describe('OperationalTelemetryService', () => {
    const defaultConfig = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        lspConsole: {
            debug: () => {},
            error: () => {},
            info: () => {},
            log: () => {},
            warn: () => {},
        } as any,
        endpoint: 'https://test.endpoint',
        telemetryOptOut: true,
    }

    beforeEach(() => {
        // @ts-ignore
        OperationalTelemetryService.sdk?.shutdown()
        // @ts-ignore
        OperationalTelemetryService.instance = undefined

        sinon.stub(NodeSDK.prototype, 'start').callsFake(() => {})
        sinon.stub(NodeSDK.prototype, 'shutdown').callsFake(() => new Promise<void>(() => {}))
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('constructor', () => {
        it('should not start SDK when telemetryOptOut is true', () => {
            const config = { ...defaultConfig, telemetryOptOut: true }
            OperationalTelemetryService.getInstance(config)

            sinon.assert.notCalled(NodeSDK.prototype.start as sinon.SinonStub)
        })

        it('should start SDK when telemetryOptOut is false', () => {
            const config = { ...defaultConfig, telemetryOptOut: false }
            OperationalTelemetryService.getInstance(config)

            sinon.assert.calledOnce(NodeSDK.prototype.start as sinon.SinonStub)
        })
    })

    describe('toggleOptOut', () => {
        it('should do nothing when new value matches current telemetryOptOut state', () => {
            const config = { ...defaultConfig, telemetryOptOut: false }
            const optel = OperationalTelemetryService.getInstance(config)
            ;(NodeSDK.prototype.start as sinon.SinonStub).resetHistory()
            ;(NodeSDK.prototype.shutdown as sinon.SinonStub).resetHistory()

            optel.toggleOptOut(false)

            sinon.assert.notCalled(NodeSDK.prototype.start as sinon.SinonStub)
            sinon.assert.notCalled(NodeSDK.prototype.shutdown as sinon.SinonStub)
        })

        it('should shutdown SDK when switching from opt-in to opt-out', () => {
            const config = { ...defaultConfig, telemetryOptOut: false }
            const optel = OperationalTelemetryService.getInstance(config)

            optel.toggleOptOut(true)

            sinon.assert.calledOnce(NodeSDK.prototype.shutdown as sinon.SinonStub)
        })

        it('should start SDK when switching from opt-out to opt-in', () => {
            const config = { ...defaultConfig, telemetryOptOut: true }
            const optel = OperationalTelemetryService.getInstance(config)

            optel.toggleOptOut(false)

            sinon.assert.calledOnce(NodeSDK.prototype.start as sinon.SinonStub)
        })

        it('should correctly handle multiple toggles between opt-in and opt-out', () => {
            // Initial: telemetry enabled
            const config = { ...defaultConfig, telemetryOptOut: false }
            const optel = OperationalTelemetryService.getInstance(config)

            sinon.assert.notCalled(NodeSDK.prototype.shutdown as sinon.SinonStub)
            sinon.assert.calledOnce(NodeSDK.prototype.start as sinon.SinonStub)

            // First toggle: opt-in -> opt-out
            optel.toggleOptOut(true)
            sinon.assert.calledOnce(NodeSDK.prototype.shutdown as sinon.SinonStub)
            sinon.assert.calledOnce(NodeSDK.prototype.start as sinon.SinonStub)

            // Second toggle: opt-out -> opt-in
            optel.toggleOptOut(false)
            sinon.assert.calledTwice(NodeSDK.prototype.start as sinon.SinonStub)
            sinon.assert.calledOnce(NodeSDK.prototype.shutdown as sinon.SinonStub)

            // Third toggle: opt-in -> opt-out
            optel.toggleOptOut(true)
            sinon.assert.calledTwice(NodeSDK.prototype.start as sinon.SinonStub)
            sinon.assert.calledTwice(NodeSDK.prototype.shutdown as sinon.SinonStub)

            // Fourth toggle: opt-out -> opt-in
            optel.toggleOptOut(false)
            sinon.assert.calledThrice(NodeSDK.prototype.start as sinon.SinonStub)
            sinon.assert.calledTwice(NodeSDK.prototype.shutdown as sinon.SinonStub)
        })
    })

    describe('getInstance', () => {
        it('should return the same instance when getInstance is called multiple times', () => {
            const instance1 = OperationalTelemetryService.getInstance(defaultConfig)
            const instance2 = OperationalTelemetryService.getInstance(defaultConfig)

            assert.strictEqual(instance1, instance2)
        })
    })
})
