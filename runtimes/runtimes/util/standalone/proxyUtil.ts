/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs'
import { Agent as HttpsAgent } from 'node:https'
import { X509Certificate } from 'node:crypto'
import { ConfigurationOptions } from 'aws-sdk'
import { HttpsProxyAgent } from 'hpagent'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { readMacosCertificates, readLinuxCertificates, readWindowsCertificates } from './certificatesReaders'

export class ProxyConfigManager {
    /**
     * Environment variables for proxy configuration, in order of precedence
     */
    private PROXY_ENV_VARS = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy']
    private cachedV2Config?: ConfigurationOptions
    private cachedV3Config?: NodeHttpHandler
    private cachedAgent?: HttpsAgent | HttpsProxyAgent

    getSecureAgent(): HttpsAgent | HttpsProxyAgent {
        if (!this.cachedAgent) {
            this.cachedAgent = this.createSecureAgent()
        }
        return this.cachedAgent
    }

    public getV2ProxyConfig(): ConfigurationOptions {
        if (!this.cachedV2Config) {
            const agent = this.getSecureAgent()
            this.cachedV2Config = {
                httpOptions: {
                    agent: agent,
                },
            }
        }
        return this.cachedV2Config
    }

    public getV3ProxyConfig(): NodeHttpHandler {
        if (!this.cachedV3Config) {
            const agent = this.getSecureAgent()
            this.cachedV3Config = new NodeHttpHandler({
                httpAgent: agent,
                httpsAgent: agent,
            })
        }
        return this.cachedV3Config
    }

    getProxyUrl(): string | undefined {
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

    readCertificateFile(path: string): string | undefined {
        try {
            const cert = readFileSync(path, { encoding: 'utf-8' })
            console.log(`Successfully read certificates from ${path}`)

            return cert
        } catch (error) {
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
        const certificates: string[] = []

        try {
            const certs = this.readSystemCertificates()
            if (certs) {
                certificates.push(...certs)
            }
        } catch (error) {
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

        console.debug(`Using ${validCerts.length} certificates`)
        return validCerts
    }

    /**
     * Creates an HTTPS agent configured with certificates and proxy settings if applicable.
     * The agent is configured to always validate certificates for secure communication.
     *
     * @returns {HttpsAgent | HttpsProxyAgent}
     */
    createSecureAgent(): HttpsAgent | HttpsProxyAgent {
        const certs = this.getCertificates()
        const agentOptions = {
            ca: certs,
            rejectUnauthorized: true, // Always validate certificates
        }

        const proxyUrl = this.getProxyUrl()

        // Proxy agent for explicit proxy
        if (proxyUrl) {
            console.log(`Using HTTP proxy at ${proxyUrl}`)

            return new HttpsProxyAgent({
                ...agentOptions,
                proxy: proxyUrl,
                cert: certs,
            })
        }

        // Proxy agent for transparent proxy network setup
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
            } catch (error) {
                console.warn(`Error parsing certificate: ${error}`)
                return false
            }
        })

        if (validCerts.length < certs.length) {
            console.log(`Removed ${certs.length - validCerts.length} expired certificates.`)
        }

        return validCerts
    }
}
