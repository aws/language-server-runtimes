import { ErrorEventAttr, ResourceUsageAttr, OperationalEvent } from './types/generated/telemetry'

export type OperationalEventAttr = ResourceUsageAttr | ErrorEventAttr

export type EventName = OperationalEvent['baseInfo']['name']
export type ErrorType = ErrorEventAttr['errorType']

export interface OperationalTelemetry {
    registerGaugeProvider(
        metricName: string,
        valueProvider: () => number,
        attributes?: Record<string, any>,
        scopeName?: string
    ): void
    recordEvent(eventName: EventName, eventAttr: OperationalEventAttr, scopeName?: string): void
    toggleOptOut(telemetryOptOut: boolean): void
}

class NoopOperationalTelemetry implements OperationalTelemetry {
    toggleOptOut(telemetryOptOut: boolean): void {}

    registerGaugeProvider(
        _metricName: string,
        _valueProvider: () => number,
        _attributes?: Record<string, any>,
        _scopeName?: string
    ): void {}

    recordEvent(_eventName: EventName, _eventAttr: OperationalEventAttr, _scopeName?: string): void {}
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

    recordEvent(eventName: EventName, eventAttr: OperationalEventAttr, scopeName?: string): void {
        this.telemetryService.recordEvent(eventName, eventAttr, scopeName ?? this.defaultScopeName)
    }

    registerGaugeProvider(
        metricName: string,
        valueProvider: () => number,
        attributes?: Record<string, any>,
        scopeName?: string
    ): void {
        this.telemetryService.registerGaugeProvider(
            metricName,
            valueProvider,
            attributes,
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

export enum TELEMETRY_SCOPES {
    RUNTIMES = 'language-server-runtimes',
}
