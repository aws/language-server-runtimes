import { ExportResult, ExportResultCode } from '@opentelemetry/core'
import { MetricData, PushMetricExporter, ResourceMetrics, ScopeMetrics } from '@opentelemetry/sdk-metrics'
import { OperationalMetric, OperationalTelemetry } from './operational-telemetry'
import { Resource } from '@opentelemetry/resources'
import { diag } from '@opentelemetry/api'
import { AwsCognitoApiGatewaySender } from './aws-cognito-gateway-sender'
import { OperationalTelemetrySchema } from './metric-types/generated/telemetry'

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

    private extractOperationalData(metrics: ResourceMetrics): OperationalTelemetrySchema[] {
        return metrics.scopeMetrics
            .map((scopeMetrics: ScopeMetrics) => {
                return scopeMetrics.metrics.map((metric: MetricData) => {
                    return this.metricToOperationalEvent(metric, metrics.resource)
                })
            })
            .flat()
    }

    private metricToOperationalEvent(metric: MetricData, resource: Resource): OperationalTelemetrySchema {
        const dataPoint = metric.dataPoints[0]
        return {
            sessionId: 'sessionid',
            batchTimestamp: 12,
            server: {
                name: this.telemetryService.getCustomAttributes()['server.name'] as string,
            },
            clientInfo: {
                name: this.telemetryService.getCustomAttributes()['clientInfo.name'] as string,
            },
            scopes: [
                {
                    scopeName: 'scope from resources',
                    data: [],
                },
            ],
        }
    }
}
