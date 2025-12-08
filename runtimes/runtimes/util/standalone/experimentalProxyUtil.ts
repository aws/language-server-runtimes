/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs'
import * as tls from 'node:tls'
import { Agent as HttpsAgent } from 'node:https'
import { X509Certificate } from 'node:crypto'
import { HttpsProxyAgent } from 'hpagent'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { readMacosCertificates, readLinuxCertificates, readWindowsCertificates } from './certificatesReaders'
import { Telemetry } from '../../../server-interface'
import { OperationalTelemetryProvider, TELEMETRY_SCOPES } from '../../operational-telemetry/operational-telemetry'
import { getMacSystemProxy } from './getProxySettings/getMacProxySettings'
import { getWindowsSystemProxy } from './getProxySettings/getWindowsProxySettings'

export class ProxyConfigManager {
    /**
     * Environment variables for proxy configuration, in order of precedence
     */
    private PROXY_ENV_VARS = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy']
    private cachedV3Config?: NodeHttpHandler
    private cachedAgent?: HttpsAgent | HttpsProxyAgent

    constructor(private readonly telemetry: Telemetry) {}

    async getSecureAgent(): Promise<HttpsAgent | HttpsProxyAgent> {
        if (!this.cachedAgent) {
            this.cachedAgent = await this.createSecureAgent()
        }
        return this.cachedAgent
    }

    public async getV3ProxyConfig(): Promise<NodeHttpHandler> {
        if (!this.cachedV3Config) {
            const agent = await this.getSecureAgent()
            this.cachedV3Config = new NodeHttpHandler({
                httpAgent: agent,
                httpsAgent: agent,
            })
        }
        return this.cachedV3Config
    }

    getProxyUrlFromEnv(): string | undefined {
        for (const envVar of this.PROXY_ENV_VARS) {
            const proxyUrl = process.env[envVar]
            if (proxyUrl) {
                if (!this.isValidProxyUrl(proxyUrl)) {
                    console.warn(`Invalid proxy URL in ${envVar}: ${proxyUrl}`)
                    continue
                }
                return proxyUrl
            }
        }
        return undefined
    }

    private static async getSystemProxy(): Promise<string | undefined> {
        switch (process.platform) {
            case 'darwin':
                return getMacSystemProxy()?.proxyUrl
            case 'win32':
                return (await getWindowsSystemProxy())?.proxyUrl
            default:
                return undefined
        }
    }

    readCertificateFile(path: string): string | undefined {
        try {
            const cert = readFileSync(path, { encoding: 'utf-8' })
            console.log(`Successfully read certificates from ${path}`)

            return cert
        } catch (error: any) {
            OperationalTelemetryProvider.getTelemetryForScope(TELEMETRY_SCOPES.RUNTIMES).emitEvent({
                errorOrigin: 'caughtError',
                errorName: error?.name ?? 'unknown',
                errorType: 'proxyCertificateReadFile',
                errorCode: error?.code ?? '',
                errorMessage: 'Failed to read certificates from given path',
            })
            console.warn(`Failed to read certificates from ${path}:`, error)
        }
    }

    readSystemCertificates(): string[] {
        const platform = process.platform
        let certs: string[] = []

        if (platform === 'darwin') {
            certs = readMacosCertificates()
        } else if (platform === 'linux') {
            certs = readLinuxCertificates()
        } else if (platform === 'win32') {
            certs = readWindowsCertificates()
        } else {
            console.error('Unsupported platform for reading certificates, skipping.')
            return []
        }

        console.log(`Read certificates for ${platform} platform: ${certs.length}`)
        return certs
    }

    /**
     * Reads and aggregates SSL/TLS certificates from multiple sources:
     * - Operating System certificates
     * - AWS_CA_BUNDLE environment variable (if set)
     * - NODE_EXTRA_CA_CERTS environment variable (if set)
     *
     * @returns {string[]} Array of certificate strings in PEM format
     */
    getCertificates(): string[] {
        // Preserve NodeJS default certificates
        const certificates = [...tls.rootCertificates]

        try {
            const certs = this.readSystemCertificates()
            if (certs) {
                certificates.push(...certs)
            }
        } catch (error: any) {
            OperationalTelemetryProvider.getTelemetryForScope(TELEMETRY_SCOPES.RUNTIMES).emitEvent({
                errorOrigin: 'caughtError',
                errorName: error?.name ?? 'unknown',
                errorType: 'proxySystemCertificateRead',
                errorCode: error?.code ?? '',
                errorMessage: 'Failed to read system certificates',
            })
            console.warn('Failed to read system certificates:', error)
        }

        if (process.env.AWS_CA_BUNDLE) {
            const cert = this.readCertificateFile(process.env.AWS_CA_BUNDLE)
            cert && certificates.push(cert)
        }

        if (process.env.NODE_EXTRA_CA_CERTS) {
            const cert = this.readCertificateFile(process.env.NODE_EXTRA_CA_CERTS)
            cert && certificates.push(cert)
        }

        console.debug(`Total certificates read: ${certificates.length}`)
        const validCerts = this.removeExpiredCertificates(certificates)

        console.debug(`Using certificates: ${validCerts.length}`)
        return validCerts
    }

    /**
     * Creates an HTTPS agent configured with certificates and proxy settings if applicable.
     * The agent is configured to always validate certificates for secure communication.
     *
     * @returns {HttpsAgent | HttpsProxyAgent}
     */
    async createSecureAgent(): Promise<HttpsAgent | HttpsProxyAgent> {
        const certs = this.getCertificates()
        const agentOptions = {
            ca: certs,
            rejectUnauthorized: true, // Always validate certificates
            keepAlive: true,
            keepAliveMsecs: 30000, // Keep alive for 30 seconds
            maxSockets: 10, // Maximum number of sockets to allow per host
        }

        // First check environment variables
        const envProxyUrl = this.getProxyUrlFromEnv()
        if (envProxyUrl) {
            this.emitProxyMetric('Explicit', certs.length, envProxyUrl)
            return new HttpsProxyAgent({ ...agentOptions, proxy: envProxyUrl })
        }

        // Fall back to OS auto‑detect (HTTP or HTTPS only)
        const sysProxyUrl = await ProxyConfigManager.getSystemProxy()
        if (sysProxyUrl) {
            this.emitProxyMetric('AutoDetect', certs.length, sysProxyUrl)
            return new HttpsProxyAgent({ ...agentOptions, proxy: sysProxyUrl })
        }

        // Proxy agent for NoProxy network setup
        this.emitProxyMetric('NoProxy', certs.length)
        return new HttpsAgent(agentOptions)
    }

    private isValidProxyUrl(url: string): boolean {
        try {
            new URL(url)
            return true
        } catch {
            return false
        }
    }

    private removeExpiredCertificates(certs: string[]) {
        const validCerts = certs.filter(cert => {
            try {
                const certObj = new X509Certificate(cert)
                const certDate = Date.parse(certObj.validTo)

                return certDate > Date.now()
            } catch (error: any) {
                OperationalTelemetryProvider.getTelemetryForScope(TELEMETRY_SCOPES.RUNTIMES).emitEvent({
                    errorOrigin: 'caughtError',
                    errorName: error?.name ?? 'unknown',
                    errorType: 'proxyCertificateRemove',
                    errorCode: error?.code ?? '',
                    errorMessage: 'Error parsing certificate',
                })
                console.warn(`Error parsing certificate: ${error}`)
                return false
            }
        })

        if (validCerts.length < certs.length) {
            console.log(`Removed expired certificates: ${certs.length - validCerts.length}`)
        }

        return validCerts
    }

    /**
    Helper that sends a single, well‑structured metric about how we configured
    outbound HTTP(s) traffic for the runtime.
    *
    @param mode  How we got the proxy:
                'Explicit'   – user env‑vars
                'AutoDetect' – os‑proxy-config result
                'NoProxy'– no proxy at all
    @param certs Number of CA certs injected into the Agent
    @param proxyUrl   The proxy URL (if any) – omitted for Transparent / Failure
    @param ok    Whether the operation succeeded (true | false)
    */
    private emitProxyMetric(
        mode: 'Explicit' | 'AutoDetect' | 'NoProxy',
        certs: number,
        proxyUrl?: string,
        ok: boolean = true
    ): void {
        this.telemetry.emitMetric({
            name: 'runtime_httpProxyConfiguration',
            result: ok ? 'Succeeded' : 'Failed',
            data: {
                proxyMode: mode,
                certificatesNumber: certs,
                ...(proxyUrl && { proxyUrl }),
            },
        })
    }
}
