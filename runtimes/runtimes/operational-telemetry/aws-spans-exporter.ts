import { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base'
import { ExportResult, ExportResultCode } from '@opentelemetry/core'
import { AwsCognitoApiGatewaySender } from './aws-cognito-gateway-sender'
import { OperationalTelemetry, TelemetryStatus } from './operational-telemetry'
import { diag } from '@opentelemetry/api'
import { OperationalEvent, OperationalTelemetrySchema } from './types/generated/telemetry'
import { OperationalEventValidator } from './operational-event-validator'

export class AwsSpanExporter implements SpanExporter {
    private readonly telemetryService: OperationalTelemetry
    private readonly sender: AwsCognitoApiGatewaySender
    private readonly eventValidator: OperationalEventValidator

    private isShutdown = false

    constructor(
        telemetryService: OperationalTelemetry,
        sender: AwsCognitoApiGatewaySender,
        eventValidator: OperationalEventValidator
    ) {
        this.telemetryService = telemetryService
        this.sender = sender
        this.eventValidator = eventValidator
    }

    export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
        if (this.isShutdown) {
            diag.warn('Export attempted on shutdown exporter')
            resultCallback({ code: ExportResultCode.FAILED })
            return
        }
        if (this.telemetryService.getTelemetryStatus() === TelemetryStatus.Pending) {
            // add to queue
            resultCallback({ code: ExportResultCode.SUCCESS })
            return
        }
        if (this.telemetryService.getTelemetryStatus() === TelemetryStatus.Disabled) {
            // clean queue
            diag.warn('Telemetry is disabled, dropping metrics')
            resultCallback({ code: ExportResultCode.SUCCESS })
            return
        }
        if (spans.length === 0) {
            diag.warn('No spans to export')
            resultCallback({ code: ExportResultCode.SUCCESS })
            return
        }

        try {
            const operationalData = this.extractOperationalData(spans)
            this.sender
                .sendOperationalTelemetryData(operationalData)
                .then(() => {
                    diag.info('Successfully exported operational spans batch')
                    resultCallback({ code: ExportResultCode.SUCCESS })
                })
                .catch(err => {
                    diag.error('Failed to export operational spans:', err)
                    resultCallback({ code: ExportResultCode.FAILED })
                })
        } catch (error) {
            diag.error('Failed to extract operational data from spans:', error)
            resultCallback({ code: ExportResultCode.FAILED })
        }
    }

    forceFlush(): Promise<void> {
        if (this.isShutdown) {
            diag.warn('Force flush attempted on shutdown exporter')
        }
        return Promise.resolve()
    }

    shutdown(): Promise<void> {
        if (this.isShutdown) {
            diag.warn('Duplicate shutdown attempt - exporter is already in shutdown state')
        }
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
            {} as Record<string, OperationalEvent[]>
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

    private spanToOperationalEvent(span: ReadableSpan): OperationalEvent {
        const unixEpochSeconds = span.endTime[0]
        const result: Record<string, any> = {}

        result['name'] = span.name
        result['timestamp'] = unixEpochSeconds
        for (const key of Object.keys(span.attributes)) {
            result[key] = String(span.attributes[key])
        }

        const isValid = this.eventValidator.validateEvent(result)
        if (!isValid) {
            throw Error(`Invalid operational event: ${result}`)
        }
        return result as OperationalEvent
    }
}
