# Operational Telemetry for Language Server Runtimes

The Operational Telemetry Service collects, processes and exports operational telemetry data from language server runtimes. This service integrates with OpenTelemetry to gather various types of operational data. Based on the telemetry-schemas, curretnly it can collect:
* resource usage metrics, 
* caught errors, 
* server crashes.

Json telemetry schemas can be extended in the future to send other type of operational data. These schemas have a strictly defined format that will be validated before sending an event.

The collected data is then securely sent in batches via http to an AWS API Gateway endpoint using Cognito authentication. Collected data is sent on a best effort basis, and any telemetry related error should not impact customer experience using standalone runtime.


## Telemetry Opt-Out

The OperationalTelemetryService implements a telemetry opt-out mechanism that respects user privacy preferences and allows changes during the session without restarting the IDE. When telemetry is opted out, all data collection and exports are disabled through OpenTelemetry SDK shutdown. The opt-out state can be toggled at any time using the toggleOptOut method.

For the standalone runtime, the OperationalTelemetryService instance is initialized during the initialize handshake. It checks for telemetry preferences in the initialization options, defaulting to opted-out (true) if no preference is specified. It then instantiates the OperationalTelemetryService with these preferences along with service information and client details. A didChangeConfigurationHandler is added to listen for updates to the 'aws.optOutTelemetry' workspace setting, allowing users to dynamically toggle telemetry collection through their IDE settings. When a configuration change occurs, the handler updates the telemetry opt-out state accordingly through the OperationalTelemetryProvider.


## Usage Instructions

1. Initialize the OperationalTelemetryService and set it in the OperationalTelemetryProvider:

```typescript
const telemetryService = OperationalTelemetryService.getInstance({serviceName: 'language-server-runtimes', serviceVersion: '1.0.0', lspConsole: lspConnection.console, poolId: 'poolId', region: 'us-east-1', endpoint: 'example.com', telemetryOptOut: false});
OperationalTelemetryProvider.setTelemetryInstance(telemetryService)
```

2. Retrieve the telemetry instance from the provider and register gauge providers for resource usage metrics:

```typescript
const telemetryService = OperationalTelemetryProvider.getTelemetryForScope('myScope');
telemetryService.registerGaugeProvider('ResourceUsageMetric', () => process.cpuUsage().user, {type: 'userCpuUsage'});
telemetryService.registerGaugeProvider('ResourceUsageMetric', () => process.cpuUsage().system, {type: 'systemCpuUsage'});
telemetryService.registerGaugeProvider('ResourceUsageMetric', () => process.memoryUsage().heapUsed, {type: 'heapUsed'});
telemetryService.registerGaugeProvider('ResourceUsageMetric', () => process.memoryUsage().heapTotal, {type: 'heapTotal'});
telemetryService.registerGaugeProvider('ResourceUsageMetric', () => process.memoryUsage().rss, {type: 'rss'});
```

3. Record errors or server crashes:

```typescript
telemetryService.recordEvent('CaughtErrorEvent', { errorType: 'TypeError' });
telemetryService.recordEvent('ServerCrashEvent', { crashType: 'OutOfMemory' });
```

## Configuration

The service requires the following configuration:

- AWS Cognito Identity Pool ID
- AWS Region
- AWS API Gateway Endpoint

This can be configured using the following environment variables:
- `TELEMETRY_GATEWAY_ENDPOINT` - The endpoint URL for the telemetry gateway
- `TELEMETRY_COGNITO_REGION` - AWS region for Cognito authentication
- `TELEMETRY_COGNITO_POOL_ID` - Cognito Pool ID for authentication

Default values for these configurations can be found in `language-server-runtimes/runtimes/runtimes/util/telemetryLspServer.ts`.

## Data Flow

1. Metrics and spans are collected by OpenTelemetry SDK - PeriodicExportingMetricReader and BatchSpanProcessor.
2. AwsMetricExporter and AwsSpanExporter process the collected data.
3. Data is formatted according to the telemetry schemas.
4. AwsCognitoApiGatewaySender sends the formatted data to AWS API Gateway.

```
[Application] -> [OpenTelemetry SDK] -> [AwsMetricExporter/AwsSpanExporter]
                                     -> [AwsCognitoApiGatewaySender] -> [AWS API Gateway]
```