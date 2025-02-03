import { Sha256 } from '@aws-crypto/sha256-js'
import {
    CognitoIdentityClient,
    Credentials,
    GetCredentialsForIdentityCommand,
    GetIdCommand,
} from '@aws-sdk/client-cognito-identity'
import { ExportResult, ExportResultCode } from '@opentelemetry/core'
import { MetricData, PushMetricExporter, ResourceMetrics, ScopeMetrics } from '@opentelemetry/sdk-metrics'
import { HttpRequest } from '@smithy/protocol-http'
import { SignatureV4 } from '@smithy/signature-v4'
import axios from 'axios'
import { OperationalMetric, OperationalTelemetry } from './operational-telemetry'
import { Resource } from '@opentelemetry/resources'
import { diag } from '@opentelemetry/api'

export class AwsCognitoApiGatewayMetricExporter implements PushMetricExporter {
    private readonly endpoint: string
    private readonly region: string
    private readonly poolId: string
    private readonly telemetryService: OperationalTelemetry

    private isShutdown = false

    private credentials: Credentials | null = null
    private credentialsLastFetched: Date | null = null
    private readonly CREDENTIALS_EXPIRATION_TIME_MS = 60 * 60 * 1000 // 60 minutes, default for cognito crednetials
    private readonly CREDENTIALS_BUFFER_TIME_MS = 1 * 60 * 1000 // 1 min

    constructor(endpoint: string, region: string, poolId: string, telemetryService: OperationalTelemetry) {
        this.endpoint = endpoint
        this.region = region
        this.poolId = poolId
        this.telemetryService = telemetryService
    }

    async export(metrics: ResourceMetrics, resultCallback: (result: ExportResult) => void): Promise<void> {
        if (this.isShutdown) {
            diag.warn('Export attempted on shutdown exporter')
            setImmediate(resultCallback, { code: ExportResultCode.FAILED })
            return
        }

        try {
            const operationalMetrics = this.extractOperationalMetrics(metrics)
            await this.refreshCognitoCredentials(this.region, this.poolId)
            await this.sendOperationalMetrics(operationalMetrics)

            diag.info('Successfully exported operational metrics batch')
            resultCallback({ code: ExportResultCode.SUCCESS })
        } catch (error) {
            diag.error('Failed to export metrics:', error)
            resultCallback({ code: ExportResultCode.FAILED })
            return
        }
    }

    forceFlush(): Promise<void> {
        if (this.isShutdown) {
            diag.warn('Force flush attempted on shutdown exporter')
        }
        // todo run export
        return Promise.resolve()
    }

    shutdown(): Promise<void> {
        if (this.isShutdown) {
            diag.warn('Duplicate shutdown attempt - exporter is already in shutdown state')
        }
        // todo run export
        this.isShutdown = true
        return Promise.resolve()
    }

    private async refreshCognitoCredentials(region: string, poolId: string): Promise<Credentials> {
        if (this.credentials && this.credentialsLastFetched) {
            const now = new Date()
            const timeSinceLastFetch = now.getTime() - this.credentialsLastFetched.getTime()

            if (timeSinceLastFetch < this.CREDENTIALS_EXPIRATION_TIME_MS - this.CREDENTIALS_BUFFER_TIME_MS) {
                return this.credentials
            }
        }

        const cognitoIdentity = new CognitoIdentityClient({ region })
        const identityResponse = await cognitoIdentity.send(
            new GetIdCommand({
                IdentityPoolId: poolId,
            })
        )

        const credentialsResponse = await cognitoIdentity.send(
            new GetCredentialsForIdentityCommand({
                IdentityId: identityResponse.IdentityId,
            })
        )

        if (!credentialsResponse.Credentials) {
            diag.error('Failed to refresh Cognito credentials')
            throw new Error('No credentials received')
        }

        this.credentialsLastFetched = new Date()
        this.credentials = credentialsResponse.Credentials

        return this.credentials
    }

    private signRequest(url: URL, body: string, region: string, credentials: Credentials) {
        const request = new HttpRequest({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                host: url.host,
            },
            hostname: url.host,
            path: url.pathname,
            body: body,
        })

        const signer = new SignatureV4({
            credentials: {
                accessKeyId: credentials.AccessKeyId!,
                secretAccessKey: credentials.SecretKey!,
                sessionToken: credentials.SessionToken!,
            },
            region: region,
            service: 'execute-api',
            sha256: Sha256,
        })

        return signer.sign(request)
    }

    private extractOperationalMetrics(metrics: ResourceMetrics): OperationalMetric[] {
        return metrics.scopeMetrics
            .map((scopeMetrics: ScopeMetrics) => {
                return scopeMetrics.metrics.map((metric: MetricData) => {
                    return this.toOperationalMetric(metric, metrics.resource)
                })
            })
            .flat()
    }

    private toOperationalMetric(metric: MetricData, resource: Resource): OperationalMetric {
        const dataPoint = metric.dataPoints[0]
        return {
            name: metric.descriptor.name,
            value: dataPoint.value as number,
            timestamp: dataPoint.endTime[0],
            metrics: {},
            atrributes: [],
            server: {
                name: resource.attributes['service.name'] as string,
                version: resource.attributes['service.version'] as string,
            },
            clientInfo: {
                name: this.telemetryService.getCustomAttributes()['clientInfo.name'] as string,
            },
        }
    }

    private async sendOperationalMetrics(metrics: OperationalMetric[]) {
        for (const metric of metrics) {
            const body = JSON.stringify(metric)
            const url = new URL(this.endpoint)
            const signedRequest = await this.signRequest(url, body, this.region, this.credentials!)

            try {
                const response = await axios({
                    method: 'POST',
                    url: this.endpoint,
                    data: body,
                    headers: signedRequest.headers,
                })

                diag.debug('Operational metrics response status code:', response.status)
            } catch (e) {
                throw Error('Failed to send metric')
            }
        }
    }
}
