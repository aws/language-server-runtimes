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
import { OperationalEventValidator } from './operational-event-validator'

export class OperationalTelemetryService implements OperationalTelemetry {
    private customAttributes: Record<string, any> = {}
    private static instance: OperationalTelemetryService
    private readonly RUNTIMES_SCOPE_NAME = 'language-server-runtimes'

    static getInstance(
        serviceName: string,
        serviceVersion: string,
        lspConsole: RemoteConsole,
        poolId: string,
        region: string,
        endpoint: string
    ): OperationalTelemetryService {
        if (!OperationalTelemetryService.instance) {
            OperationalTelemetryService.instance = new OperationalTelemetryService(
                serviceName,
                serviceVersion,
                lspConsole,
                poolId,
                region,
                endpoint
            )
        }
        diag.error('Operational telemetry already initialized')
        return OperationalTelemetryService.instance
    }

    private constructor(
        serviceName: string,
        serviceVersion: string,
        lspConsole: RemoteConsole,
        poolId: string,
        region: string,
        endpoint: string
    ) {
        diag.setLogger(
            {
                debug: message => lspConsole.debug(message),
                error: message => lspConsole.error(message),
                info: message => lspConsole.info(message),
                verbose: message => lspConsole.log(message),
                warn: message => lspConsole.warn(message),
            },
            DiagLogLevel.ALL
        )

        const eventValidator = new OperationalEventValidator()
        const awsSender = new AwsCognitoApiGatewaySender(endpoint, region, poolId)
        const metricExporter = new AwsMetricExporter(this, awsSender, eventValidator)
        const spansExporter = new AwsSpanExporter(this, awsSender, eventValidator)

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
