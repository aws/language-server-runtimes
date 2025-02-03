import { RemoteConsole } from 'vscode-languageserver'

export type OperationalMetric = {
    name: string
    value: number
    timestamp: number
    atrributes: { string: any }[]
    metrics: {}
    server: {
        name: string
        version: string
    }
    clientInfo: {
        name: string
    }
}

export interface OperationalTelemetry {
    initialize(serviceName: string, serviceVersion: string, console: RemoteConsole): void
    registerGaugeProvider(gaugeName: string, valueProvider: () => number, attributes?: Record<string, any>): void
    recordGauge(gaugeName: string, value: number, attributes?: Record<string, any>): void
    incrementCounter(counterName: string, value: number, attributes?: Record<string, any>): void
    getCustomAttributes(): Record<string, any>
    updateCustomAttributes(key: string, value: any): void
}
