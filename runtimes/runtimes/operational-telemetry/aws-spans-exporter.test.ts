import assert from 'assert'
import sinon from 'sinon'
import { AwsSpanExporter } from './aws-spans-exporter'
import { ExportResultCode } from '@opentelemetry/core'
import { ReadableSpan } from '@opentelemetry/sdk-trace-base'
import { AwsCognitoApiGatewaySender } from './aws-cognito-gateway-sender'
import { OperationalEventValidator } from './operational-event-validator'

describe('AWSSpanExporter', () => {
    let exporter: AwsSpanExporter
    let sender: sinon.SinonStubbedInstance<AwsCognitoApiGatewaySender>
    let resultCallback: sinon.SinonSpy

    const mockSpans: ReadableSpan[] = [
        {
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
            instrumentationLibrary: {
                name: 'test-scope',
            },
            endTime: [1234567890, 838000000],
            name: 'ErrorEvent',
            attributes: {
                'event.attributes': `{"errorName":"Error1","errorOrigin":"caughtError","errorType":"parseError"}`,
            },
        } as any,
        {
            resource: {
                attributes: {
                    sessionId: 'test-session',
                    'service.name': 'test-service',
                    'service.version': '1.0.0',
                },
            },
            instrumentationLibrary: {
                name: 'test-scope',
            },
            endTime: [1234567890, 838000000],
            name: 'ErrorEvent',
            attributes: {
                'event.attributes': `{"errorName":"Error2","errorOrigin":"caughtError","errorType":"parseError"}`,
            },
        } as any,
    ]

    beforeEach(() => {
        sender = {
            sendOperationalTelemetryData: sinon.stub().resolves(),
        } as any

        exporter = new AwsSpanExporter(sender as any, new OperationalEventValidator())
        resultCallback = sinon.spy()
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('export', () => {
        it('should successfully export spans', async () => {
            await new Promise<void>(resolve => {
                exporter.export(mockSpans, result => {
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
                exporter.export(mockSpans, result => {
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
                exporter.export(mockSpans, result => {
                    resultCallback(result)
                    resolve()
                })
            })

            assert.equal(sender.sendOperationalTelemetryData.called, false)
        })

        it('should correctly transform spans to operational data', async () => {
            await new Promise<void>(resolve => {
                exporter.export(mockSpans, result => {
                    resultCallback(result)
                    resolve()
                })
            })

            const expectedData = {
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
                                baseInfo: {
                                    name: 'ErrorEvent',
                                    timestamp: sinon.match.number,
                                },
                                errorAttributes: {
                                    errorName: 'Error1',
                                    errorOrigin: 'caughtError',
                                    errorType: 'parseError',
                                },
                            },
                            {
                                baseInfo: {
                                    name: 'ErrorEvent',
                                    timestamp: sinon.match.number,
                                },
                                errorAttributes: {
                                    errorName: 'Error2',
                                    errorOrigin: 'caughtError',
                                    errorType: 'parseError',
                                },
                            },
                        ],
                    },
                ],
            }

            assert.ok(sender.sendOperationalTelemetryData.calledOnce)
            sinon.assert.calledWith(sender.sendOperationalTelemetryData, sinon.match(expectedData))
        })

        it('should handle invalid span names', async () => {
            const invalidSpans = [
                {
                    ...mockSpans[0],
                    name: 'InvalidEvent',
                },
            ] as ReadableSpan[]

            await new Promise<void>(resolve => {
                exporter.export(invalidSpans, result => {
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
