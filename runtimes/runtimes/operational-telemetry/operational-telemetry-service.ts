import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { AwsMetricExporter } from './aws-metrics-exporter'
import { MetricType, OperationalTelemetry } from './operational-telemetry'
import opentelemetry, { diag, Attributes, DiagLogLevel, trace, SpanStatusCode } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { randomUUID } from 'crypto'
import { RemoteConsole } from 'vscode-languageserver'
import { AwsCognitoApiGatewaySender } from './aws-cognito-gateway-sender'
import { AWSSpanExporter } from './aws-spans-exporter'
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

    incrementCounter(metricName: string, value?: number, attributes?: Record<string, any>): void {
        if (!this.initialized) {
            diag.error('Operational telemetry not initialized')
            return
        }

        const meter = opentelemetry.metrics.getMeter(this.SCOPE_NAME)
        const counter = meter.createCounter(metricName.toString())
        counter.add(value ? value : 1, attributes as Attributes)
    }

    recordGauge(metricName: string, value: number, attributes?: Record<string, any>): void {
        if (!this.initialized) {
            diag.error('Operational telemetry not initialized')
            return
        }

        const meter = opentelemetry.metrics.getMeter(this.SCOPE_NAME)
        const gauge = meter.createGauge(metricName.toString())
        gauge.record(value, attributes as Attributes)
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

        const poolId = ''
        const region = ''
        const endpoint = ''

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

        const awsSender = new AwsCognitoApiGatewaySender(endpoint, region, poolId)
        const metricExporter = new AwsMetricExporter(this, awsSender)
        const spansExporter = new AWSSpanExporter(this, awsSender)

        const metricReader = new PeriodicExportingMetricReader({
            exporter: metricExporter,
            exportIntervalMillis: 5000,
        })

        const sdk = new NodeSDK({
            resource: new Resource({
                [ATTR_SERVICE_NAME]: serviceName,
                [ATTR_SERVICE_VERSION]: serviceVersion,
                sessionId: randomUUID(),
            }),
            metricReader: metricReader,
            spanProcessor: new BatchSpanProcessor(spansExporter),
        })

        sdk.start()

        process.on('beforeExit', async () => {
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
