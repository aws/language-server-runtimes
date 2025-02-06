import { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base'
import { ExportResult, ExportResultCode } from '@opentelemetry/core'
import { AwsCognitoApiGatewaySender } from './aws-cognito-gateway-sender'
import { OperationalTelemetry } from './operational-telemetry'
import { diag } from '@opentelemetry/api'
import { CaughtErrorEvent, OperationalTelemetrySchema, ServerCrashEvent } from './metric-types/generated/telemetry'

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
        const scopeRecords = spans.reduce(
            (acc, span) => {
                const scopeName = span.instrumentationLibrary.name
                if (!acc[scopeName]) {
                    acc[scopeName] = []
                }
                acc[scopeName].push(this.spanToOperationalEvent(span))
                return acc
            },
            {} as Record<string, (CaughtErrorEvent | ServerCrashEvent)[]>
        )
        const scopes = Object.entries(scopeRecords).map(([scopeName, scopeSpans]) => {
            return { scopeName: scopeName, data: scopeSpans }
        })

        return {
            sessionId: spans[0].resource.attributes['sessionId'] as string,
            batchTimestamp: Date.now(),
            server: {
                name: spans[0].resource.attributes['service.name'] as string,
                version: spans[0].resource.attributes['service.version'] as string | undefined,
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

    private spanToOperationalEvent(span: ReadableSpan): CaughtErrorEvent | ServerCrashEvent {
        if (span.name === 'CaughtErrorEvent') {
            return {
                name: span.name,
                timestamp: Date.now(),
                errorType: span.attributes['errorType'] as string,
            } as CaughtErrorEvent
        }
        if (span.name === 'ServerCrashEvent') {
            return {
                name: span.name,
                timestamp: Date.now(),
                crashType: span.attributes['crashType'] as string,
            } as ServerCrashEvent
        }
        throw Error('Unknown span name: ' + span.name)
    }
}
