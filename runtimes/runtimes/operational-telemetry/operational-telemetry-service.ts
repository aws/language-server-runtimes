import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { AwsMetricExporter } from './aws-metrics-exporter'
import {
    EventName,
    MetricName,
    OperationalEventAttr,
    OperationalTelemetry,
    ValueProviders,
} from './operational-telemetry'
import { diag, Attributes, DiagLogLevel, trace, metrics } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { randomUUID } from 'crypto'
import { RemoteConsole } from 'vscode-languageserver'
import { AwsCognitoApiGatewaySender } from './aws-cognito-gateway-sender'
import { AwsSpanExporter } from './aws-spans-exporter'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { OperationalEventValidator } from './operational-event-validator'
import { ExtendedClientInfo } from '../../server-interface'
import { ResourceUsageAttr, ResourceUsageMetric } from './types/generated/telemetry'

type OperationalTelemetryConfig = {
    serviceName: string
    serviceVersion?: string
    extendedClientInfo?: ExtendedClientInfo
    lspConsole: RemoteConsole
    poolId: string
    region: string
    endpoint: string
    telemetryOptOut: boolean
}

type AwsConfig = {
    endpoint: string
    region: string
    poolId: string
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

        this.baseResource = new Resource({
            [ATTR_SERVICE_NAME]: config.serviceName,
            [ATTR_SERVICE_VERSION]: config.serviceVersion,
            'clientInfo.name': config.extendedClientInfo?.name,
            'clientInfo.version': config.extendedClientInfo?.version,
            'clientInfo.clientId': config.extendedClientInfo?.clientId,
            'clientInfo.extension.name': config.extendedClientInfo?.extension.name,
            'clientInfo.extension.version': config.extendedClientInfo?.extension.version,
            sessionId: randomUUID(),
        })

        this.awsConfig = {
            endpoint: config.endpoint,
            region: config.region,
            poolId: config.poolId,
        }

        this.telemetryOptOut = config.telemetryOptOut

        if (!this.telemetryOptOut) {
            this.startupSdk()
        }

        // Registering process events callbacks once
        process.on('uncaughtException', async () => {
            // Metrics and spans are force flushed to their exporters on shutdown.
            await this.shutdownSdk()
            process.exit(1)
        })

        process.on('beforeExit', async () => {
            // Metrics and spans are force flushed to their exporters on shutdown.
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
        const eventValidator = new OperationalEventValidator()
        const awsSender = new AwsCognitoApiGatewaySender(
            this.awsConfig.endpoint,
            this.awsConfig.region,
            this.awsConfig.poolId
        )
        const metricExporter = new AwsMetricExporter(awsSender, eventValidator)
        const spansExporter = new AwsSpanExporter(awsSender, eventValidator)

        const fiveMinutes = 300000
        const fiveSeconds = 5000

        // Collects metrics every `exportIntervalMillis` and sends it to exporter.
        // Registered callbacks are evaluated once during the collection process.
        const metricReader = new PeriodicExportingMetricReader({
            exporter: metricExporter,
            exportIntervalMillis: fiveMinutes,
        })

        // Sends collected spans every `scheduledDelayMillis` if batch is non-empty.
        // Triggers export immediately when collected spans reach `maxExportBatchSize` limit.
        const spanProcessor = new BatchSpanProcessor(spansExporter, {
            maxExportBatchSize: 20,
            scheduledDelayMillis: fiveSeconds,
        })

        this.sdk = new NodeSDK({
            resource: this.baseResource,
            metricReader: metricReader,
            spanProcessor: spanProcessor,
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

    recordEvent(eventName: EventName, eventAttr: OperationalEventAttr, scopeName?: string): void {
        const tracer = trace.getTracer(scopeName ?? this.RUNTIMES_SCOPE_NAME)
        const span = tracer.startSpan(eventName)
        span.setAttribute('event.attributes', JSON.stringify(eventAttr))
        span.end()
    }

    registerGaugeProvider(
        metricName: MetricName,
        valueProviders: ValueProviders<ResourceUsageAttr>,
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
