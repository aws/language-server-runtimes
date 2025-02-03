import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { AWSMetricExporter } from './aws-metric-exporter'
import { OperationalTelemetry } from './operational-telemetry'
import opentelemetry, { diag, Attributes, DiagLogLevel } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions/*'
import { randomUUID } from 'crypto'
import { RemoteConsole } from 'vscode-languageserver'

export class OperationalTelemetryService implements OperationalTelemetry {
    private customResource: Record<string, any> = {}
    private static instance: OperationalTelemetryService
    private SCOPE_NAME = 'language-server-runtimes'
    private initialized = false

    private constructor() {}

    reportCounterMetric(counterName: string, value = 1, attributes?: Record<string, any>): void {
        if (!this.initialized) {
            diag.error('Operational telemetry not initialized')
            return
        }

        const meter = opentelemetry.metrics.getMeter(this.SCOPE_NAME)
        const counter = meter.createCounter(counterName)
        counter.add(value, attributes as Attributes)
    }

    setPeriodicGauge(gaugeName: string, valueGetter: () => number, attributes?: Record<string, any>): void {
        if (!this.initialized) {
            diag.error('Operational telemetry not initialized')
            return
        }

        const meter = opentelemetry.metrics.getMeter(this.SCOPE_NAME)
        const gauge = meter.createObservableGauge(gaugeName)
        gauge.addCallback(result => {
            result.observe(valueGetter(), attributes as Attributes)
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

        const exporter = new AWSMetricExporter(endpoint, region, poolId, this)

        const metricReader = new PeriodicExportingMetricReader({
            exporter: exporter,
            exportIntervalMillis: 5000,
        })

        const sdk = new NodeSDK({
            resource: new Resource({
                [ATTR_SERVICE_NAME]: serviceName,
                [ATTR_SERVICE_VERSION]: serviceVersion,
                sessionId: randomUUID(),
            }),
            metricReader: metricReader,
        })

        sdk.start()
    }

    getResource(): Record<string, any> {
        return this.customResource
    }

    updateResource(key: string, value: any): void {
        this.customResource[key] = value
    }
}
