import { OperationalEventValidator } from './operational-event-validator'
import assert from 'assert'

describe('OperationalEventValidator', () => {
    let validator: OperationalEventValidator

    before(() => {
        validator = new OperationalEventValidator()
    })

    describe('validateEvent', () => {
        it('should return true for a valid CaughtErrorEvent', () => {
            const event = {
                name: 'CaughtErrorEvent',
                timestamp: 100000,
                errorName: 'Error',
            }

            const result = validator.validateEvent(event)
            assert.ok(result)
        })

        it('should return true for a valid ResourceUsageMetric', () => {
            const event = {
                name: 'ResourceUsageMetric',
                timestamp: 100000,
                userCpuUsage: 100,
                systemCpuUsage: 1,
                heapUsed: 2,
                heapTotal: 3,
                rss: 4,
            }

            const result = validator.validateEvent(event)
            assert.ok(result)
        })

        it('should return true for a valid ServerCrashEvent', () => {
            const event = {
                name: 'ServerCrashEvent',
                timestamp: 100000,
                crashType: 'Error',
            }

            const result = validator.validateEvent(event)
            assert.ok(result)
        })

        it('should return false when missing fields', () => {
            const invalidEvent = {
                name: 'ServerCrashEvent',
                crashType: 'Error',
            }

            const result = validator.validateEvent(invalidEvent)
            assert.ok(!result)
        })
    })
})
