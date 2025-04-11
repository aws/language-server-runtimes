import { ErrorEventAttributes, ResourceUsageAttributes, OperationalEvent } from './types/generated/telemetry'

export type OperationalEventAttributes = ResourceUsageAttributes | ErrorEventAttributes

export type EventName = OperationalEvent['baseInfo']['name']
export type MetricName = 'ResourceUsageMetric'
export type ErrorOrigin = ErrorEventAttributes['errorOrigin']

export type ValueProviders<T> = {
    [K in keyof T]: () => number
}

export interface OperationalTelemetry {
    registerGaugeProvider(
        metricName: MetricName,
        valueProviders: ValueProviders<ResourceUsageAttributes>,
        scopeName?: string
    ): void
    recordEvent(eventName: EventName, eventAttr: OperationalEventAttributes, scopeName?: string): void
    toggleOptOut(telemetryOptOut: boolean): void
}

class NoopOperationalTelemetry implements OperationalTelemetry {
    toggleOptOut(telemetryOptOut: boolean): void {}

    registerGaugeProvider(
        _metricName: MetricName,
        _valueProvider: ValueProviders<ResourceUsageAttributes>,
        _scopeName?: string
    ): void {}

    recordEvent(_eventName: EventName, _eventAttr: OperationalEventAttributes, _scopeName?: string): void {}
}

class ScopedTelemetryService implements OperationalTelemetry {
    private telemetryService: OperationalTelemetry
    private defaultScopeName: string

    constructor(scope: string, telemetryService: OperationalTelemetry) {
        this.telemetryService = telemetryService
        this.defaultScopeName = scope
    }

    toggleOptOut(telemetryOptOut: boolean): void {
        this.telemetryService.toggleOptOut(telemetryOptOut)
    }

    recordEvent(eventName: EventName, eventAttr: OperationalEventAttributes, scopeName?: string): void {
        this.telemetryService.recordEvent(eventName, eventAttr, scopeName ?? this.defaultScopeName)
    }

    registerGaugeProvider(
        metricName: MetricName,
        valueProviders: ValueProviders<ResourceUsageAttributes>,
        scopeName?: string
    ): void {
        this.telemetryService.registerGaugeProvider(
            metricName,
            valueProviders,
            scopeName ? scopeName : this.defaultScopeName
        )
    }
}

export class OperationalTelemetryProvider {
    private static telemetryInstance: OperationalTelemetry = new NoopOperationalTelemetry()

    static setTelemetryInstance(telemetryInstance: OperationalTelemetry): void {
        OperationalTelemetryProvider.telemetryInstance = telemetryInstance
    }

    static getTelemetryForScope(scopeName: string): OperationalTelemetry {
        return new ScopedTelemetryService(scopeName, OperationalTelemetryProvider.telemetryInstance)
    }
}

export const TELEMETRY_SCOPES = {
    RUNTIMES: 'language-server-runtimes',
} as const
