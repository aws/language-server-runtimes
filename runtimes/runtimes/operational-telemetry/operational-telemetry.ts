export interface OperationalTelemetry {
    registerGaugeProvider(
        metricName: string,
        valueProvider: () => number,
        attributes?: Record<string, any>,
        scopeName?: string
    ): void
    recordEvent(eventType: string, attributes?: Record<string, any>, scopeName?: string): void
    getCustomAttributes(): Record<string, any>
    updateCustomAttributes(key: string, value: any): void
}

export class OperationalTelemetryProvider {
    private static telemetryInstance: OperationalTelemetry

    static setTelemetryInstance(telemetryInstance: OperationalTelemetry): void {
        OperationalTelemetryProvider.telemetryInstance = telemetryInstance
    }

    static getTelemetryForScope(scopeName: string): OperationalTelemetry {
        if (!OperationalTelemetryProvider.telemetryInstance) {
            return new NoopOperationalTelemetry()
        }

        return new ScopedTelemetryService(scopeName, OperationalTelemetryProvider.telemetryInstance)
    }
}

class NoopOperationalTelemetry implements OperationalTelemetry {
    registerGaugeProvider(
        _metricName: string,
        _valueProvider: () => number,
        _attributes?: Record<string, any>,
        _scopeName?: string
    ): void {}

    recordEvent(_eventType: string, _attributes?: Record<string, any>, _scopeName?: string): void {}

    getCustomAttributes(): Record<string, any> {
        return {}
    }

    updateCustomAttributes(_key: string, _value: any): void {}
}

class ScopedTelemetryService implements OperationalTelemetry {
    private telemetryService: OperationalTelemetry
    private defaultScopeName: string

    constructor(scope: string, telemetryService: OperationalTelemetry) {
        this.telemetryService = telemetryService
        this.defaultScopeName = scope
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

    getCustomAttributes(): Record<string, any> {
        return this.telemetryService.getCustomAttributes()
    }

    updateCustomAttributes(key: string, value: any): void {
        this.telemetryService.updateCustomAttributes(key, value)
    }
}
