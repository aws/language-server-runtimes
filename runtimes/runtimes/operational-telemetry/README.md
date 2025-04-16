# Operational Telemetry for Language Server Runtimes

The Operational Telemetry Service collects, processes and exports operational telemetry data from language server runtimes. This service integrates with OpenTelemetry to gather various types of operational data. Based on the [telemetry-schemas](./telemetry-schemas/), curretnly it can collect:
* resource usage metrics, 
* caught/uncaught errors.

Json telemetry schemas can be extended in the future to send other type of operational data. These schemas have a strictly defined format that allow us to benefit from TypeScript type checks and validation on the backend.

The collected data is then securely sent in batches via https to an AWS API Gateway endpoint. Collected data is sent on a best effort basis, and any telemetry related error should not impact customer experience using standalone runtime.


## Telemetry Opt-Out

The OperationalTelemetryService implements a telemetry opt-out mechanism that respects user privacy preferences and allows changes during the session without restarting the IDE. When telemetry is opted out, all data collection and exports are disabled through OpenTelemetry SDK shutdown. The opt-out state can be toggled at any time using the toggleOptOut method.

For the standalone runtime, the OperationalTelemetryService instance is initialized during the initialize handshake. It checks for telemetry preferences in the initialization options, defaulting to opted-out (true) if no preference is specified. It then instantiates the OperationalTelemetryService with these preferences along with service information and client details. A didChangeConfigurationHandler is added to listen for updates to the 'aws.optOutTelemetry' workspace setting, allowing users to dynamically toggle telemetry collection through their IDE settings. When a configuration change occurs, the handler updates the telemetry opt-out state accordingly through the OperationalTelemetryProvider.


## Usage Instructions

1. Initialize the OperationalTelemetryService and set it in the OperationalTelemetryProvider:

```typescript
const telemetryService = OperationalTelemetryService.getInstance({serviceName: 'language-server-runtimes', serviceVersion: '1.0.0', lspConsole: lspConnection.console, endpoint: 'example.com', telemetryOptOut: false});
OperationalTelemetryProvider.setTelemetryInstance(telemetryService)
```

2. Retrieve the telemetry instance from the provider and register gauge providers for resource usage metrics:

```typescript
const telemetryService = OperationalTelemetryProvider.getTelemetryForScope('myScope');
telemetryService.registerGaugeProvider('heapTotal', () => process.memoryUsage().heapTotal, 'byte')
telemetryService.registerGaugeProvider('heapUsed', () => process.memoryUsage().heapUsed, 'byte')
telemetryService.registerGaugeProvider('rss', () => process.memoryUsage().rss, 'byte')
```

3. Record errors or server crashes:

```typescript
telemetryService.emitEvent({
    errorOrigin: 'caughtError',
    errorType: 'proxyCertificateRead',
    errorName: error?.name ?? 'unknown',
    errorCode: error?.code ?? '',
    errorMessage: 'Failed to parse server name',
})
```

## Configuration

The service requires the following configuration:
- AWS API Gateway Endpoint

This can be configured using the following environment variables:
- `TELEMETRY_GATEWAY_ENDPOINT` - The endpoint URL for the telemetry gateway

Default values for these configurations can be found in `language-server-runtimes/runtimes/runtimes/util/telemetryLspServer.ts`.

## Data Flow

1. Telemetry signals are collected by OpenTelemetry SDK.
2. OTLP HTTP exporters transform and export collected data.
3. Telemetry data reaches AWS API Gateway endpoint.

```
[Application] -> [OpenTelemetry SDK] -> [OTLP HTTP request] -> [AWS API Gateway]
```