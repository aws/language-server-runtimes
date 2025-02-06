import { Sha256 } from '@aws-crypto/sha256-js'
import {
    CognitoIdentityClient,
    Credentials,
    GetCredentialsForIdentityCommand,
    GetIdCommand,
} from '@aws-sdk/client-cognito-identity'
import { HttpRequest } from '@smithy/protocol-http'
import { SignatureV4 } from '@smithy/signature-v4'
import axios from 'axios'
import { diag } from '@opentelemetry/api'
import { OperationalTelemetrySchema } from './types/generated/telemetry'

export class AwsCognitoApiGatewaySender {
    private readonly endpoint: string
    private readonly region: string
    private readonly poolId: string

    private credentials: Credentials | null = null
    private credentialsLastFetched: Date | null = null
    private readonly CREDENTIALS_EXPIRATION_TIME_MS = 60 * 60 * 1000 // 60 minutes, default for cognito crednetials
    private readonly CREDENTIALS_BUFFER_TIME_MS = 1 * 60 * 1000 // 1 min

    constructor(endpoint: string, region: string, poolId: string) {
        this.endpoint = endpoint
        this.region = region
        this.poolId = poolId
    }

    async sendOperationalTelemetryData(data: OperationalTelemetrySchema): Promise<void> {
        await this.refreshCognitoCredentials(this.region, this.poolId)
        await this.postTelemetryData(data)

        diag.info('Successfully sent operational metrics batch')
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

    private async postTelemetryData(data: OperationalTelemetrySchema) {
        const body = JSON.stringify(data)
        const url = new URL(this.endpoint)
        const signedRequest = await this.signRequest(url, body, this.region, this.credentials!)

        // todo retry mechanism
        const response = await axios({
            method: 'POST',
            url: this.endpoint,
            data: body,
            headers: signedRequest.headers,
        })

        diag.debug(`Operational telemetry HTTP status: ${response.status}, message: ${response.statusText}`)

        if (response.status < 200 || response.status >= 300) {
            throw new Error(
                `HTTP error sending operational telemetry, status: ${response.status}, message: ${response.statusText}`
            )
        }
    }
}
