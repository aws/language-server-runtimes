import { ExportResult, ExportResultCode } from '@opentelemetry/core'
import { MetricData, PushMetricExporter, ResourceMetrics, ScopeMetrics } from '@opentelemetry/sdk-metrics'
import { diag } from '@opentelemetry/api'
import { AwsCognitoApiGatewaySender } from './aws-cognito-gateway-sender'
import { OperationalEvent, OperationalTelemetrySchema } from './types/generated/telemetry'
import { OperationalEventValidator } from './operational-event-validator'

export class AwsMetricExporter implements PushMetricExporter {
    private readonly sender: AwsCognitoApiGatewaySender
    private readonly eventValidator: OperationalEventValidator
    // todo batching queue for events received from reader

    private isShutdown = false

    constructor(sender: AwsCognitoApiGatewaySender, eventValidator: OperationalEventValidator) {
        this.sender = sender
        this.eventValidator = eventValidator
    }

    export(metrics: ResourceMetrics, resultCallback: (result: ExportResult) => void): void {
        if (this.isShutdown) {
            diag.warn('Export attempted on shutdown exporter')
            setImmediate(resultCallback, { code: ExportResultCode.FAILED })
            return
        }
        if (metrics.scopeMetrics.length === 0) {
            diag.warn('No metrics to export')
            resultCallback({ code: ExportResultCode.SUCCESS })
            return
        }

        try {
            const operationalData = this.extractOperationalData(metrics)
            this.sender
                .sendOperationalTelemetryData(operationalData)
                .then(() => {
                    diag.info('Successfully exported operational metrics batch')
                    resultCallback({ code: ExportResultCode.SUCCESS })
                })
                .catch(err => {
                    diag.error('Failed to export operational metrics:', err)
                    resultCallback({ code: ExportResultCode.FAILED })
                })
        } catch (error) {
            diag.error('Failed to extract operational data from metrics:', error)
            resultCallback({ code: ExportResultCode.FAILED })
        }
    }

    forceFlush(): Promise<void> {
        if (this.isShutdown) {
            diag.warn('Force flush attempted on shutdown exporter')
        }
        // todo flush batch queue
        return Promise.resolve()
    }

    shutdown(): Promise<void> {
        if (this.isShutdown) {
            diag.warn('Duplicate shutdown attempt - exporter is already in shutdown state')
        }
        // todo flush batch queue
        this.isShutdown = true
        return Promise.resolve()
    }

    private extractOperationalData(metrics: ResourceMetrics): OperationalTelemetrySchema {
        const scopes = metrics.scopeMetrics.map((scopeMetrics: ScopeMetrics) => {
            return {
                scopeName: scopeMetrics.scope.name,
                data: scopeMetrics.metrics.map((metric: MetricData) => {
                    return this.metricToOperationalEvent(metric)
                }),
            }
        }) // todo filter undefined

        return {
            sessionId: metrics.resource.attributes['sessionId'] as string,
            batchTimestamp: Date.now(),
            server: {
                name: metrics.resource.attributes['service.name'] as string,
                version: metrics.resource.attributes['service.version'] as string | undefined,
            },
            clientInfo: {
                name: metrics.resource.attributes['clientInfo.name'] as string | undefined,
                version: metrics.resource.attributes['clientInfo.version'] as string | undefined,
                extension: {
                    name: metrics.resource.attributes['clientInfo.extension.name'] as string | undefined,
                    version: metrics.resource.attributes['clientInfo.extension.version'] as string | undefined,
                },
                clientId: metrics.resource.attributes['clientInfo.clientId'] as string | undefined,
            },
            scopes: scopes,
        }
    }

    private metricToOperationalEvent(metric: MetricData): OperationalEvent {
        const dataPoints = metric.dataPoints.reduce(
            (acc, point) => {
                acc[point.attributes['type'] as string] = point.value as number
                return acc
            },
            {} as Record<string, number>
        )

        const unixEpochSeconds = metric.dataPoints[0].endTime[0]
        const result = {
            name: metric.descriptor.name,
            timestamp: unixEpochSeconds,
            ...dataPoints,
        }

        const isValid = this.eventValidator.validateEvent(result)
        if (!isValid) {
            throw Error(`Invalid operational event: ${result}`)
        }

        return result as OperationalEvent
    }
}
