import { OperationalEventValidator } from './operational-event-validator'
import assert from 'assert'

describe('OperationalEventValidator', () => {
    let validator: OperationalEventValidator

    before(() => {
        validator = new OperationalEventValidator()
    })

    describe('validateEvent', () => {
        it('should return true for a valid ResourceUsageMetric', () => {
            const event = {
                baseInfo: {
                    name: 'ResourceUsageMetric',
                    timestamp: 100000,
                },
                resourceValues: {
                    userCpuUsage: 100,
                    systemCpuUsage: 1,
                    heapUsed: 2,
                    heapTotal: 3,
                    rss: 4,
                },
            }

            const result = validator.validateEvent(event)
            assert.ok(result)
        })

        it('should return true for a valid ErrorEvent', () => {
            const event = {
                baseInfo: {
                    name: 'ErrorEvent',
                    timestamp: 100000,
                },
                errorAttributes: {
                    errorName: 'Error',
                    errorOrigin: 'uncaughtException',
                    errorType: 'responseFailed',
                },
            }

            const result = validator.validateEvent(event)
            assert.ok(result)
        })

        it('should return false when missing fields', () => {
            const invalidEvent = {
                baseInfo: {
                    name: 'ErrorEvent',
                    timestamp: 100000,
                },
                errorAttributes: {
                    errorName: 'Error',
                    errorType: 'uncaughtException',
                },
            }

            const result = validator.validateEvent(invalidEvent)
            assert.ok(!result)
        })
    })
})
