import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { MetricName, OperationalEventAttributes, OperationalTelemetry, ValueProviders } from './operational-telemetry'
import { diag, DiagLogLevel, metrics } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { Resource, resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { randomUUID } from 'crypto'
import { RemoteConsole } from 'vscode-languageserver'
import * as optelLogs from '@opentelemetry/api-logs'
import { ExtendedClientInfo } from '../../server-interface'
import { OperationalTelemetryResource, ResourceUsageAttributes } from './types/generated/telemetry'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'

type OperationalTelemetryConfig = {
    serviceName: string
    serviceVersion?: string
    extendedClientInfo?: ExtendedClientInfo
    lspConsole: RemoteConsole
    endpoint: string
    telemetryOptOut: boolean
}

type AwsConfig = {
    endpoint: string
}

export class OperationalTelemetryService implements OperationalTelemetry {
    private static instance: OperationalTelemetryService
    private readonly RUNTIMES_SCOPE_NAME = 'language-server-runtimes'
    private sdk: NodeSDK | null = null
    private readonly baseResource: Resource
    private awsConfig: AwsConfig
    private telemetryOptOut: boolean

    static getInstance(config: OperationalTelemetryConfig): OperationalTelemetryService {
        if (!OperationalTelemetryService.instance) {
            OperationalTelemetryService.instance = new OperationalTelemetryService(config)
        }
        return OperationalTelemetryService.instance
    }

    private constructor(config: OperationalTelemetryConfig) {
        diag.setLogger(
            {
                debug: message => config.lspConsole.debug(message),
                error: message => config.lspConsole.error(message),
                info: message => config.lspConsole.info(message),
                verbose: message => config.lspConsole.log(message),
                warn: message => config.lspConsole.warn(message),
            },
            DiagLogLevel.ALL
        )

        // const opresource: OperationalTelemetryResource = {
        //     'service.name': config.serviceName,
        //     'service.version': config.serviceVersion,
        //     'clientInfo.name': config.extendedClientInfo?.name,
        //     'clientInfo.version': config.extendedClientInfo?.version,
        //     'clientInfo.clientId': config.extendedClientInfo?.clientId,
        //     'clientInfo.extension.name': config.extendedClientInfo?.extension.name,
        //     'clientInfo.extension.version': config.extendedClientInfo?.extension.version,
        //     'operational.telemetry.version': '1.0.0',
        //     sessionId: randomUUID(),
        // }
        this.baseResource = resourceFromAttributes({
            [ATTR_SERVICE_NAME]: config.serviceName,
            [ATTR_SERVICE_VERSION]: config.serviceVersion,
            'clientInfo.name': config.extendedClientInfo?.name,
            'clientInfo.version': config.extendedClientInfo?.version,
            'clientInfo.clientId': config.extendedClientInfo?.clientId,
            'clientInfo.extension.name': config.extendedClientInfo?.extension.name,
            'clientInfo.extension.version': config.extendedClientInfo?.extension.version,
            'operational.telemetry.version': '1.0.0',
            sessionId: randomUUID(),
        })

        this.awsConfig = {
            endpoint: config.endpoint,
        }

        this.telemetryOptOut = config.telemetryOptOut

        if (!this.telemetryOptOut) {
            this.startupSdk()
        }

        // Registering process events callbacks once
        process.on('uncaughtException', async () => {
            // Telemetry signals are force flushed to their exporters on shutdown.
            await this.shutdownSdk()
            process.exit(1)
        })

        process.on('beforeExit', async () => {
            // Telemetry signals are force flushed to their exporters on shutdown.
            await this.shutdownSdk()
        })
    }

    toggleOptOut(telemetryOptOut: boolean): void {
        if (this.telemetryOptOut === telemetryOptOut) {
            return
        }

        this.telemetryOptOut = telemetryOptOut

        if (this.telemetryOptOut) {
            this.shutdownSdk()
        } else {
            this.startupSdk()
        }
    }

    private startupSdk() {
        const metricExporter = new OTLPMetricExporter({
            url: this.awsConfig.endpoint,
        })
        const logsExporter = new OTLPLogExporter({
            url: this.awsConfig.endpoint,
        })

        const fiveMinutes = 300000
        const fiveSeconds = 5000

        // Collects metrics every `exportIntervalMillis` and sends it to exporter.
        // Registered callbacks are evaluated once during the collection process.
        const metricReader = new PeriodicExportingMetricReader({
            exporter: metricExporter,
            exportIntervalMillis: fiveSeconds,
        })

        // Sends collected logs every `scheduledDelayMillis` if batch is non-empty.
        // Triggers export immediately when collected logs reach `maxExportBatchSize` limit.
        const logProcessor = new BatchLogRecordProcessor(logsExporter, {
            maxExportBatchSize: 20,
            scheduledDelayMillis: fiveSeconds,
        })

        this.sdk = new NodeSDK({
            resource: this.baseResource,
            autoDetectResources: false,
            metricReader: metricReader,
            logRecordProcessors: [logProcessor],
        })

        this.sdk.start()
    }

    private async shutdownSdk() {
        try {
            await this.sdk?.shutdown()
        } catch (error) {
            console.error('Error during opentelemetry SDK shutdown:', error)
        }
    }

    emitEvent(eventAttr: OperationalEventAttributes, scopeName?: string): void {
        const logger = optelLogs.logs.getLogger(scopeName ?? this.RUNTIMES_SCOPE_NAME)

        logger.emit({
            attributes: { ...eventAttr },
        })
    }

    registerGaugeProvider(
        metricName: MetricName,
        valueProviders: ValueProviders<ResourceUsageAttributes>,
        scopeName?: string
    ): void {
        const meter = metrics.getMeter(scopeName ? scopeName : this.RUNTIMES_SCOPE_NAME)
        const gauge = meter.createObservableGauge(metricName)

        for (const [key, valueProvider] of Object.entries(valueProviders)) {
            gauge.addCallback(result => {
                result.observe(valueProvider(), { type: key })
            })
        }
    }
}
