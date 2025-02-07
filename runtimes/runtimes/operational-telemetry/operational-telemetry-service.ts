import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { AwsMetricExporter } from './aws-metrics-exporter'
import { OperationalTelemetry } from './operational-telemetry'
import opentelemetry, { diag, Attributes, DiagLogLevel, trace } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { randomUUID } from 'crypto'
import { RemoteConsole } from 'vscode-languageserver'
import { AwsCognitoApiGatewaySender } from './aws-cognito-gateway-sender'
import { AwsSpanExporter } from './aws-spans-exporter'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'

export class OperationalTelemetryService implements OperationalTelemetry {
    private customAttributes: Record<string, any> = {}
    private static instance: OperationalTelemetryService
    private readonly SCOPE_NAME = 'language-server-runtimes'
    private initialized = false

    private constructor() {}

    recordEvent(eventType: string, attributes?: Record<string, any>): void {
        if (!this.initialized) {
            diag.error('Operational telemetry not initialized')
            return
        }
        const tracer = trace.getTracer(this.SCOPE_NAME)

        const span = tracer.startSpan(eventType)
        if (attributes) {
            for (const [key, value] of Object.entries(attributes)) {
                span.setAttribute(key, value)
            }
        }
        span.end()
    }

    registerGaugeProvider(metricName: string, valueProvider: () => number, attributes?: Record<string, any>): void {
        if (!this.initialized) {
            diag.error('Operational telemetry not initialized')
            return
        }

        const meter = opentelemetry.metrics.getMeter(this.SCOPE_NAME)
        const gauge = meter.createObservableGauge(metricName.toString())
        gauge.addCallback(result => {
            result.observe(valueProvider(), attributes as Attributes)
        })
    }

    static getInstance(): OperationalTelemetryService {
        if (!OperationalTelemetryService.instance) {
            OperationalTelemetryService.instance = new OperationalTelemetryService()
        }
        return OperationalTelemetryService.instance
    }

    initialize(serviceName: string, serviceVersion: string, console: RemoteConsole): void {
        if (this.initialized) {
            diag.warn('Operational telemetry already initialized')
            return
        }
        this.initialized = true

        diag.setLogger(
            {
                debug: message => console.debug(message),
                error: message => console.error(message),
                info: message => console.info(message),
                verbose: message => console.log(message),
                warn: message => console.warn(message),
            },
            DiagLogLevel.ALL
        )

        const poolId = ''
        const region = ''
        const endpoint = ''

        const awsSender = new AwsCognitoApiGatewaySender(endpoint, region, poolId)
        const metricExporter = new AwsMetricExporter(this, awsSender)
        const spansExporter = new AwsSpanExporter(this, awsSender)

        const fiveMinutes = 300000
        const fiveSeconds = 5000

        // Collects metrics every `exportIntervalMillis` and sends it to exporter.
        // Registered callbacks are evaluated once during collection process.
        const metricReader = new PeriodicExportingMetricReader({
            exporter: metricExporter,
            exportIntervalMillis: fiveMinutes,
        })

        // Sends batch of spans every `scheduledDelayMillis`.
        const spanProcessor = new BatchSpanProcessor(spansExporter, {
            maxExportBatchSize: 20,
            scheduledDelayMillis: fiveSeconds,
        })

        const sdk = new NodeSDK({
            resource: new Resource({
                [ATTR_SERVICE_NAME]: serviceName,
                [ATTR_SERVICE_VERSION]: serviceVersion,
                sessionId: randomUUID(),
            }),
            metricReader: metricReader,
            spanProcessor: spanProcessor,
        })

        sdk.start()

        process.on('beforeExit', async () => {
            // Metrics and spans are force flushed to their exporters on shutdown.
            sdk.shutdown()
        })
    }

    getCustomAttributes(): Record<string, any> {
        return this.customAttributes
    }

    updateCustomAttributes(key: string, value: any): void {
        this.customAttributes[key] = value
    }
}
