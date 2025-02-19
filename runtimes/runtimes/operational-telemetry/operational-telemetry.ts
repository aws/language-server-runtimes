export interface OperationalTelemetry {
    registerGaugeProvider(
        metricName: string,
        valueProvider: () => number,
        attributes?: Record<string, any>,
        scopeName?: string
    ): void
    recordEvent(eventType: string, attributes?: Record<string, any>, scopeName?: string): void
    toggleTelemetry(telemetryOptOut: boolean): void
}

class NoopOperationalTelemetry implements OperationalTelemetry {
    toggleTelemetry(telemetryOptOut: boolean): void {}

    registerGaugeProvider(
        _metricName: string,
        _valueProvider: () => number,
        _attributes?: Record<string, any>,
        _scopeName?: string
    ): void {}

    recordEvent(_eventType: string, _attributes?: Record<string, any>, _scopeName?: string): void {}
}

class ScopedTelemetryService implements OperationalTelemetry {
    private telemetryService: OperationalTelemetry
    private defaultScopeName: string

    constructor(scope: string, telemetryService: OperationalTelemetry) {
        this.telemetryService = telemetryService
        this.defaultScopeName = scope
    }

    toggleTelemetry(telemetryOptOut: boolean): void {
        this.telemetryService.toggleTelemetry(telemetryOptOut)
    }

    recordEvent(eventName: string, attributes?: Record<string, any>, scopeName?: string): void {
        this.telemetryService.recordEvent(eventName, attributes, scopeName ? scopeName : this.defaultScopeName)
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
