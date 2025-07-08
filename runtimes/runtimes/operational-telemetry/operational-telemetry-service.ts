import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { OperationalEventAttributes, OperationalTelemetry } from './operational-telemetry'
import { diag, DiagLogLevel, metrics } from '@opentelemetry/api'
import { Resource, resourceFromAttributes } from '@opentelemetry/resources'
import { randomUUID } from 'crypto'
import { logs } from '@opentelemetry/api-logs'
import { ExtendedClientInfo, Logging } from '../../server-interface'
import { OperationalTelemetryResource, MetricName } from './types/generated/telemetry'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs'
import { SDK_INFO } from '@opentelemetry/core'

type OperationalTelemetryConfig = {
    serviceName: string
    serviceVersion?: string
    extendedClientInfo?: ExtendedClientInfo
    logging: Logging
    endpoint: string
    telemetryOptOut: boolean
    exportIntervalMillis?: number
    scheduledDelayMillis?: number
}

export class OperationalTelemetryService implements OperationalTelemetry {
    private static instance: OperationalTelemetryService
    private readonly RUNTIMES_SCOPE_NAME = 'language-server-runtimes'
    private readonly FIVE_MINUTES = 300000
    private readonly baseResource: Resource
    private readonly endpoint: string
    private telemetryOptOut: boolean
    private readonly exportIntervalMillis: number
    private readonly scheduledDelayMillis: number
    private loggerProvider: LoggerProvider | null = null
    private meterProvider: MeterProvider | null = null
    private readonly logging: Logging

    static getInstance(config: OperationalTelemetryConfig): OperationalTelemetryService {
        if (!OperationalTelemetryService.instance) {
            OperationalTelemetryService.instance = new OperationalTelemetryService(config)
        }
        return OperationalTelemetryService.instance
    }

    private constructor(config: OperationalTelemetryConfig) {
        this.exportIntervalMillis = config.exportIntervalMillis ?? this.FIVE_MINUTES
        this.scheduledDelayMillis = config.scheduledDelayMillis ?? this.FIVE_MINUTES

        this.logging = config.logging

        const operationalTelemetryResource: OperationalTelemetryResource = {
            'server.name': config.serviceName,
            'server.version': config.serviceVersion,
            'clientInfo.name': config.extendedClientInfo?.name,
            'clientInfo.version': config.extendedClientInfo?.version,
            'clientInfo.clientId': config.extendedClientInfo?.clientId,
            'clientInfo.extension.name': config.extendedClientInfo?.extension.name,
            'clientInfo.extension.version': config.extendedClientInfo?.extension.version,
            'operational.telemetry.schema.version': '1.0.0',
            'telemetry.sdk.version': SDK_INFO['telemetry.sdk.version'],
            sessionId: randomUUID(),
        }
        this.baseResource = resourceFromAttributes({ ...operationalTelemetryResource })

        this.endpoint = config.endpoint

        this.telemetryOptOut = config.telemetryOptOut

        if (!this.telemetryOptOut) {
            this.startApi()
        }

        // Registering process events callbacks once
        process.on('uncaughtException', async () => {
            // Telemetry signals are force flushed to their exporters on shutdown.
            await this.shutdownApi()
            process.exitCode = 1
        })

        process.on('beforeExit', async () => {
            // Telemetry signals are force flushed to their exporters on shutdown.
            await this.shutdownApi()
        })
    }

    toggleOptOut(telemetryOptOut: boolean): void {
        if (this.telemetryOptOut === telemetryOptOut) {
            return
        }

        this.telemetryOptOut = telemetryOptOut

        if (this.telemetryOptOut) {
            this.shutdownApi()
        } else {
            this.startApi()
        }
    }

    private startMetricApi() {
        const metricExporter = new OTLPMetricExporter({
            url: this.endpoint,
        })
        // Collects metrics every `exportIntervalMillis` and sends it to exporter.
        // Registered callbacks are evaluated once during the collection process.
        const metricReader = new PeriodicExportingMetricReader({
            exporter: metricExporter,
            exportIntervalMillis: this.exportIntervalMillis,
        })
        this.meterProvider = new MeterProvider({
            resource: this.baseResource,
            readers: [metricReader],
        })
        metrics.setGlobalMeterProvider(this.meterProvider)
    }

    private startLogsApi() {
        const logsExporter = new OTLPLogExporter({
            url: this.endpoint,
        })
        // Sends collected logs every `scheduledDelayMillis` if batch is non-empty.
        // Triggers export immediately when collected logs reach `maxExportBatchSize` limit.
        const logProcessor = new BatchLogRecordProcessor(logsExporter, {
            maxExportBatchSize: 20,
            scheduledDelayMillis: this.scheduledDelayMillis,
        })
        this.loggerProvider = new LoggerProvider({
            resource: this.baseResource,
        })
        this.loggerProvider.addLogRecordProcessor(logProcessor)
        logs.setGlobalLoggerProvider(this.loggerProvider)
    }

    private startApi() {
        diag.setLogger(
            {
                debug: message => this.logging.debug(message),
                error: message => this.logging.error(message),
                info: message => this.logging.info(message),
                verbose: message => this.logging.log(message),
                warn: message => this.logging.warn(message),
            },
            DiagLogLevel.ALL
        )
        this.startMetricApi()
        this.startLogsApi()
    }

    private async shutdownApi() {
        try {
            const promises: Promise<unknown>[] = []
            if (this.loggerProvider) {
                promises.push(this.loggerProvider.shutdown())
            }
            if (this.meterProvider) {
                promises.push(this.meterProvider.shutdown())
            }
            await Promise.all(promises)
            logs.disable()
            metrics.disable()
            diag.disable()
            this.loggerProvider = null
            this.meterProvider = null
        } catch (error) {
            console.error('Error during OpenTelemetry API shutdown:', error)
        }
    }

    emitEvent(eventAttr: OperationalEventAttributes, scopeName?: string): void {
        const logger = logs.getLogger(scopeName ?? this.RUNTIMES_SCOPE_NAME)

        logger.emit({
            attributes: { ...eventAttr },
        })
    }

    registerGaugeProvider(
        metricName: MetricName,
        valueProvider: () => number,
        unit?: string,
        scopeName?: string
    ): void {
        const meter = metrics.getMeter(scopeName ? scopeName : this.RUNTIMES_SCOPE_NAME)
        const gauge = meter.createObservableGauge(metricName, { unit: unit })
        gauge.addCallback(result => {
            result.observe(valueProvider())
        })
    }
}
