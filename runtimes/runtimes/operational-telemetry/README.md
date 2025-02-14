# Operational Telemetry for Language Server Runtimes

The Operational Telemetry Service collects, processes and exports operational telemetry data from language server runtimes. This service integrates with OpenTelemetry to gather various types of operational data. Based on the telemetry-schemas, curretnly it can collect:
* resource usage metrics, 
* caught errors, 
* server crashes.

Json telemetry schemas can be extended in the future to send other type of operational data. These schemas have a strictly defined format that will be validated before sending an event.

The collected data is then securely sent in batches via http to an AWS API Gateway endpoint using Cognito authentication. Collected data is sent on a best effort basis, and any telemetry related error should not impact customer experience using standalone runtime.

## Usage Instructions

1. Initialize the OperationalTelemetryService and set it in the OperationalTelemetryProvider:

```typescript
const telemetryService = OperationalTelemetryService.getInstance('language-server-runtimes', '1.0.0', remoteConsole, 'poolId', 'us-east-1', 'amazon.com');
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

These values are currently set in the `AwsCognitoApiGatewaySender` constructor in `operational-telemetry-service.ts`.

## Data Flow

1. Metrics and spans are collected by OpenTelemetry SDK - PeriodicExportingMetricReader and BatchSpanProcessor.
2. AwsMetricExporter and AwsSpanExporter process the collected data.
3. Data is formatted according to the telemetry schemas.
4. AwsCognitoApiGatewaySender sends the formatted data to AWS API Gateway.

```
[Application] -> [OpenTelemetry SDK] -> [AwsMetricExporter/AwsSpanExporter]
                                     -> [AwsCognitoApiGatewaySender] -> [AWS API Gateway]
```