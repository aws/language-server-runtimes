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

export enum MetricType {
    'memory-usage',
    'server-crash',
    'exception-catch',
}

export interface OperationalTelemetry {
    initialize(serviceName: string, serviceVersion: string, console: RemoteConsole): void
    registerGaugeProvider(metricName: string, valueProvider: () => number, attributes?: Record<string, any>): void
    recordEvent(eventType: string, attributes?: Record<string, any>): void
    getCustomAttributes(): Record<string, any>
    updateCustomAttributes(key: string, value: any): void
}
