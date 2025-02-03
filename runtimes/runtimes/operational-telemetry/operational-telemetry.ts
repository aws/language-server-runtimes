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
    setPeriodicGauge(gaugeName: string, valueGetter: () => number, attributes?: Record<string, any>): void
    reportCounterMetric(counterName: string, value: number, attributes?: Record<string, any>): void
    getResource(): Record<string, any>
    updateResource(key: string, value: any): void
}
