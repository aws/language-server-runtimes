import assert from 'assert'
import sinon from 'sinon'
import { AwsMetricExporter } from './aws-metrics-exporter'
import { ExportResultCode } from '@opentelemetry/core'
import { ResourceMetrics } from '@opentelemetry/sdk-metrics'
import { AwsCognitoApiGatewaySender } from './aws-cognito-gateway-sender'
import { OperationalEventValidator } from './operational-event-validator'

describe('AwsMetricExporter', () => {
    let exporter: AwsMetricExporter
    let sender: sinon.SinonStubbedInstance<AwsCognitoApiGatewaySender>
    let resultCallback: sinon.SinonSpy
    const mockResourceMetrics: ResourceMetrics = {
        resource: {
            attributes: {
                sessionId: 'test-session',
                'service.name': 'test-service',
                'service.version': '1.0.0',
                'clientInfo.name': 'test-client',
                'clientInfo.version': '1.2.3',
                'clientInfo.extension.name': 'test-extension',
                'clientInfo.extension.version': '1.0.0',
                'clientInfo.clientId': 'test-id',
            },
        },
        scopeMetrics: [
            {
                scope: { name: 'test-scope' },
                metrics: [
                    {
                        descriptor: {
                            name: 'ResourceUsageMetric',
                            type: 'OBSERVABLE_GAUGE',
                            description: '',
                            unit: '',
                            valueType: 1,
                            advice: {},
                        },
                        dataPoints: [
                            {
                                attributes: { type: 'heapUsed' },
                                startTime: [1234567890, 838000000],
                                endTime: [1234567890, 838000000],
                                value: 18227311,
                            },
                            {
                                attributes: { type: 'heapTotal' },
                                startTime: [1234567890, 838000000],
                                endTime: [1234567890, 838000000],
                                value: 18227312,
                            },
                            {
                                attributes: { type: 'rss' },
                                startTime: [1234567890, 838000000],
                                endTime: [1234567890, 838000000],
                                value: 18227313,
                            },
                            {
                                attributes: { type: 'userCpuUsage' },
                                startTime: [1234567890, 838000000],
                                endTime: [1234567890, 838000000],
                                value: 18227314,
                            },
                            {
                                attributes: { type: 'systemCpuUsage' },
                                startTime: [1234567890, 838000000],
                                endTime: [1234567890, 838000000],
                                value: 18227315,
                            },
                        ],
                    },
                ],
            },
        ],
    } as any

    const expected = {
        sessionId: 'test-session',
        batchTimestamp: sinon.match.number,
        server: {
            name: 'test-service',
            version: '1.0.0',
        },
        clientInfo: {
            name: 'test-client',
            version: '1.2.3',
            extension: {
                name: 'test-extension',
                version: '1.0.0',
            },
            clientId: 'test-id',
        },
        scopes: [
            {
                scopeName: 'test-scope',
                data: [
                    {
                        name: 'ResourceUsageMetric',
                        timestamp: sinon.match.number,
                        heapUsed: 18227311,
                        heapTotal: 18227312,
                        rss: 18227313,
                        userCpuUsage: 18227314,
                        systemCpuUsage: 18227315,
                    },
                ],
            },
        ],
    }

    beforeEach(() => {
        sender = {
            sendOperationalTelemetryData: sinon.stub().resolves(),
        } as any

        exporter = new AwsMetricExporter(sender as any, new OperationalEventValidator())
        resultCallback = sinon.spy()
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('export', () => {
        it('should successfully export metrics', async () => {
            await new Promise<void>(resolve => {
                exporter.export(mockResourceMetrics, result => {
                    resultCallback(result)
                    resolve()
                })
            })

            assert.ok(sender.sendOperationalTelemetryData.calledOnce)
            assert.ok(resultCallback.calledOnce)
            assert.deepEqual(resultCallback.firstCall.args[0], {
                code: ExportResultCode.SUCCESS,
            })
        })

        it('should handle export failure', async () => {
            const error = new Error('Export failed')
            sender.sendOperationalTelemetryData.rejects(error)

            await new Promise<void>(resolve => {
                exporter.export(mockResourceMetrics, result => {
                    resultCallback(result)
                    resolve()
                })
            })

            assert.ok(resultCallback.calledOnce)
            assert.deepEqual(resultCallback.firstCall.args[0], {
                code: ExportResultCode.FAILED,
            })
        })

        it('should not export when shutdown', async () => {
            await exporter.shutdown()
            await new Promise<void>(resolve => {
                exporter.export(mockResourceMetrics, result => {
                    resultCallback(result)
                    resolve()
                })
            })

            assert.strictEqual(sender.sendOperationalTelemetryData.called, false)
        })

        it('should correctly transform metrics data', async () => {
            await new Promise<void>(resolve => {
                exporter.export(mockResourceMetrics, result => {
                    resultCallback(result)
                    resolve()
                })
            })

            sinon.assert.calledWith(sender.sendOperationalTelemetryData, sinon.match(expected))
        })

        it('should throw error for unsupported metric type', async () => {
            const invalidMetrics = {
                ...mockResourceMetrics,
                scopeMetrics: [
                    {
                        scope: { name: 'test-scope' },
                        metrics: [
                            {
                                descriptor: { name: 'UnsupportedMetric' },
                                dataPoints: [],
                            },
                        ],
                    },
                ],
            } as any

            await new Promise<void>(resolve => {
                exporter.export(invalidMetrics, result => {
                    resultCallback(result)
                    resolve()
                })
            })

            assert.ok(resultCallback.calledOnce)
            assert.deepEqual(resultCallback.firstCall.args[0], {
                code: ExportResultCode.FAILED,
            })
        })
    })
})
