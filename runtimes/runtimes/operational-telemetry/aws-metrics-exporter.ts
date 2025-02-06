import { ExportResult, ExportResultCode } from '@opentelemetry/core'
import { MetricData, PushMetricExporter, ResourceMetrics, ScopeMetrics } from '@opentelemetry/sdk-metrics'
import { OperationalTelemetry } from './operational-telemetry'
import { diag } from '@opentelemetry/api'
import { AwsCognitoApiGatewaySender } from './aws-cognito-gateway-sender'
import { OperationalTelemetrySchema, ResourceUsageMetric } from './metric-types/generated/telemetry'

export class AwsMetricExporter implements PushMetricExporter {
    private readonly telemetryService: OperationalTelemetry
    private readonly sender: AwsCognitoApiGatewaySender
    // todo batching queue for events received from reader

    private isShutdown = false

    constructor(telemetryService: OperationalTelemetry, sender: AwsCognitoApiGatewaySender) {
        this.telemetryService = telemetryService
        this.sender = sender
    }

    async export(metrics: ResourceMetrics, resultCallback: (result: ExportResult) => void): Promise<void> {
        if (this.isShutdown) {
            diag.warn('Export attempted on shutdown exporter')
            setImmediate(resultCallback, { code: ExportResultCode.FAILED })
            return
        }

        try {
            const operationalMetrics = this.extractOperationalData(metrics)
            await this.sender.sendOperationalTelemetryData(operationalMetrics)

            diag.info('Successfully exported operational metrics batch')
            resultCallback({ code: ExportResultCode.SUCCESS })
        } catch (error) {
            diag.error('Failed to export metrics:', error)
            resultCallback({ code: ExportResultCode.FAILED })
            return
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
        })

        return {
            sessionId: metrics.resource.attributes['sessionId'] as string,
            batchTimestamp: Date.now(),
            server: {
                name: metrics.resource.attributes['service.name'] as string,
                version: metrics.resource.attributes['service.version'] as string | undefined,
            },
            clientInfo: {
                name: this.telemetryService.getCustomAttributes()['clientInfo.name'] as string | undefined,
                extension: {
                    name: this.telemetryService.getCustomAttributes()['clientInfo.extension.name'] as
                        | string
                        | undefined,
                    version: this.telemetryService.getCustomAttributes()['clientInfo.extension.version'] as
                        | string
                        | undefined,
                },
                clientId: this.telemetryService.getCustomAttributes()['clientInfo.clientId'] as string | undefined,
            },
            scopes: scopes,
        }
    }

    private metricToOperationalEvent(metric: MetricData): ResourceUsageMetric {
        if (metric.descriptor.name != 'ResourceUsageMetric') {
            throw new Error('Not supported metric type')
        }

        const result = metric.dataPoints.reduce(
            (acc, point) => {
                acc[point.attributes['type'] as string] = point.value as number
                return acc
            },
            {} as Record<string, number>
        )

        return {
            name: metric.descriptor.name,
            timestamp: metric.dataPoints[0].endTime[0],
            userCpuUsage: result['userCpuUsage'],
            systemCpuUsage: result['systemCpuUsage'],
            heapUsed: result['heapUsed'],
            heapTotal: result['heapTotal'],
            rss: result['rss'],
        } as ResourceUsageMetric
    }
}
