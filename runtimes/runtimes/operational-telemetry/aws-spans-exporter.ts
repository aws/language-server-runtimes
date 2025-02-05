import { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base'
import { ExportResult, ExportResultCode } from '@opentelemetry/core'
import { AwsCognitoApiGatewaySender } from './aws-cognito-gateway-sender'
import { OperationalTelemetry } from './operational-telemetry'
import { diag } from '@opentelemetry/api'
import { OperationalTelemetrySchema } from './metric-types/generated/telemetry'

export class AWSSpanExporter implements SpanExporter {
    private readonly telemetryService: OperationalTelemetry
    private readonly sender: AwsCognitoApiGatewaySender
    // todo batch queue for events received from reader

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

            diag.info('Successfully exported operational telemetry data')
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

    private extractOperationalData(spans: ReadableSpan[]): OperationalTelemetrySchema {
        return this.spanToOperationalEvent(spans[0])

        // return spans.map((span: ReadableSpan) => {
        //     return this.spanToOperationalEvent(span)
        // })
    }

    private spanToOperationalEvent(span: ReadableSpan): OperationalTelemetrySchema {
        return {
            sessionId: span.resource.attributes['sessionId'] as string,
            batchTimestamp: Date.now(),
            server: {
                name: span.resource.attributes['service.name'] as string,
                version: span.resource.attributes['service.version'] as string | undefined,
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
            scopes: [
                {
                    scopeName: 'scope from resources',
                    data: [],
                },
            ],
        }
    }
}
