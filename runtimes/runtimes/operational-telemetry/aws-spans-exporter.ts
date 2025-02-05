import { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base'
import { ExportResult, ExportResultCode } from '@opentelemetry/core'
import { AwsCognitoApiGatewaySender } from './aws-cognito-gateway-sender'
import { OperationalMetric, OperationalTelemetry } from './operational-telemetry'
import { diag } from '@opentelemetry/api'
import { OperationalTelemetrySchema } from './metric-types/generated/telemetry'

export class AWSSpanExporter implements SpanExporter {
    private readonly telemetryService: OperationalTelemetry
    private readonly sender: AwsCognitoApiGatewaySender
    // todo batching queue for events received from reader

    private isShutdown = false

    constructor(telemetryService: OperationalTelemetry, sender: AwsCognitoApiGatewaySender) {
        this.telemetryService = telemetryService
        this.sender = sender
    }

    async export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): Promise<void> {
        if (this.isShutdown) {
            diag.warn('Export attempted on shutdown exporter')
            setImmediate(resultCallback, { code: ExportResultCode.FAILED })
            return
        }

        try {
            const operationalMetrics = this.extractOperationalData(spans)
            await this.sender.sendOperationalTelemetryData(operationalMetrics)

            diag.info('Successfully exported operational metrics batch')
            resultCallback({ code: ExportResultCode.SUCCESS })
        } catch (error) {
            diag.error('Failed to export metrics:', error)
            resultCallback({ code: ExportResultCode.FAILED })
            return
        }

        console.log(spans.length)
        for (const span of spans) {
            console.log(`span:`)
            console.log(`name: ${span.name}`)
            console.log(`timespan: ${span.startTime[0]}`)
            console.log(`attributes: ${span.attributes}`)
        }

        resultCallback({ code: ExportResultCode.SUCCESS })
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

    private extractOperationalData(spans: ReadableSpan[]): OperationalTelemetrySchema[] {
        return spans.map((span: ReadableSpan) => {
            return this.spanToOperationalEvent(span)
        })
    }

    private spanToOperationalEvent(span: ReadableSpan): OperationalTelemetrySchema {
        return {
            sessionId: 'sessionid',
            batchTimestamp: 10,
            server: {
                name: this.telemetryService.getCustomAttributes()['server.name'] as string,
            },
            clientInfo: {
                name: this.telemetryService.getCustomAttributes()['clientInfo.name'] as string,
            },
            scopes: [
                {
                    scopeName: 'scope from resources',
                    metrics: [],
                },
            ],
        }
    }
}
