import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { AwsMetricExporter } from './aws-metrics-exporter'
import { OperationalTelemetry, TelemetryStatus } from './operational-telemetry'
import opentelemetry, { diag, Attributes, DiagLogLevel, trace } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { randomUUID } from 'crypto'
import { RemoteConsole } from 'vscode-languageserver'
import { AwsCognitoApiGatewaySender } from './aws-cognito-gateway-sender'
import { AwsSpanExporter } from './aws-spans-exporter'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { OperationalEventValidator } from './operational-event-validator'

type OperationalTelmetryConfig = {
    serviceName: string
    serviceVersion: string
    lspConsole: RemoteConsole
    poolId: string
    region: string
    endpoint: string
}

export class OperationalTelemetryService implements OperationalTelemetry {
    private customAttributes: Record<string, any> = {}
    private static instance: OperationalTelemetryService
    private readonly RUNTIMES_SCOPE_NAME = 'language-server-runtimes'
    private telemetryStatus = TelemetryStatus.Pending
    private sdk: NodeSDK | null = null
    // private initializeConfig: OperationalTelmetryConfig
    private spanProcessor: BatchSpanProcessor
    private metricReader: PeriodicExportingMetricReader
    private baseResource: Resource

    static getInstance(config: OperationalTelmetryConfig): OperationalTelemetryService {
        if (!OperationalTelemetryService.instance) {
            OperationalTelemetryService.instance = new OperationalTelemetryService(config)
        }
        diag.error('Operational telemetry already initialized')
        return OperationalTelemetryService.instance
    }

    private constructor(config: OperationalTelmetryConfig) {
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

        const eventValidator = new OperationalEventValidator()
        const awsSender = new AwsCognitoApiGatewaySender(config.endpoint, config.region, config.poolId)
        const metricExporter = new AwsMetricExporter(this, awsSender, eventValidator)
        const spansExporter = new AwsSpanExporter(this, awsSender, eventValidator)

        const fiveMinutes = 300000
        const fiveSeconds = 5000

        // Collects metrics every `exportIntervalMillis` and sends it to exporter.
        // Registered callbacks are evaluated once during the collection process.
        this.metricReader = new PeriodicExportingMetricReader({
            exporter: metricExporter,
            exportIntervalMillis: fiveMinutes,
        })

        // Sends collected spans every `scheduledDelayMillis` if batch is non-empty.
        // Triggers export immediately when collected spans reach `maxExportBatchSize` limit.
        this.spanProcessor = new BatchSpanProcessor(spansExporter, {
            maxExportBatchSize: 20,
            scheduledDelayMillis: fiveSeconds,
        })

        this.baseResource = new Resource({
            [ATTR_SERVICE_NAME]: config.serviceName,
            [ATTR_SERVICE_VERSION]: config.serviceVersion,
            sessionId: randomUUID(),
        })

        this.startupSdk()
    }

    getTelemetryStatus(): TelemetryStatus {
        return this.telemetryStatus
    }

    updateTelemetryStatus(newStatus: TelemetryStatus): void {
        if (this.telemetryStatus === newStatus) {
            return
        }

        const previousStatus = this.telemetryStatus
        this.telemetryStatus = newStatus

        if (newStatus === TelemetryStatus.Enabled) {
            if (previousStatus === TelemetryStatus.Disabled) {
                this.startupSdk()
            }
        }

        if (newStatus === TelemetryStatus.Disabled) {
            this.shutdownSdk()
        }
    }

    startupSdk() {
        this.sdk = new NodeSDK({
            resource: this.baseResource,
            metricReader: this.metricReader,
            spanProcessor: this.spanProcessor,
        })

        this.sdk.start()

        process.on('beforeExit', async () => {
            // Metrics and spans are force flushed to their exporters on shutdown.
            this.sdk?.shutdown()
        })
    }

    shutdownSdk() {
        this.sdk?.shutdown()
        // this.sdk=null
    }

    recordEvent(eventType: string, attributes?: Record<string, any>, scopeName?: string): void {
        const tracer = trace.getTracer(scopeName ? scopeName : this.RUNTIMES_SCOPE_NAME)

        const span = tracer.startSpan(eventType)
        if (attributes) {
            for (const [key, value] of Object.entries(attributes)) {
                span.setAttribute(key, value)
            }
        }
        span.end()
    }

    registerGaugeProvider(
        metricName: string,
        valueProvider: () => number,
        attributes?: Record<string, any>,
        scopeName?: string
    ): void {
        const meter = opentelemetry.metrics.getMeter(scopeName ? scopeName : this.RUNTIMES_SCOPE_NAME)
        const gauge = meter.createObservableGauge(metricName)
        gauge.addCallback(result => {
            result.observe(valueProvider(), attributes as Attributes)
        })
    }

    getCustomAttributes(): Record<string, any> {
        return this.customAttributes
    }

    updateCustomAttributes(key: string, value: any): void {
        this.customAttributes[key] = value
    }
}
