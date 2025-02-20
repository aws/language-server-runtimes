/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs'
import { Agent as HttpsAgent } from 'node:https'
import { systemCertsSync as readSystemCertificatesSync } from 'system-ca'
import { ConfigurationOptions } from 'aws-sdk'
import { HttpsProxyAgent } from 'hpagent'
import { NodeHttpHandler } from '@smithy/node-http-handler'

/**
 * Environment variables for proxy configuration, in order of precedence
 */
const PROXY_ENV_VARS = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy'] as const

const getProxyUrl = (): string | undefined => {
    for (const envVar of PROXY_ENV_VARS) {
        if (process.env[envVar] != null) {
            return process.env[envVar]
        }
    }
    return undefined
}

/**
 * Reads and aggregates SSL/TLS certificates from multiple sources:
 * - Operating System certificates
 * - AWS_CA_BUNDLE environment variable (if set)
 * - NODE_EXTRA_CA_CERTS environment variable (if set)
 *
 * @returns {string[]} Array of certificate strings in PEM format
 */
function getCertificates(): string[] {
    const certificates: string[] = []

    const readCertificateFile = (path: string): void => {
        try {
            certificates.push(readFileSync(path, { encoding: 'utf-8' }))
            console.log(`Successfully read certificates from ${path}`)
        } catch (error) {
            console.warn(`Failed to read certificates from ${path}:`, error)
        }
    }

    try {
        certificates.push(...readSystemCertificatesSync())
    } catch (error) {
        console.warn('Failed to read system certificates:', error)
    }

    if (process.env.AWS_CA_BUNDLE) {
        readCertificateFile(process.env.AWS_CA_BUNDLE)
    }

    if (process.env.NODE_EXTRA_CA_CERTS) {
        readCertificateFile(process.env.NODE_EXTRA_CA_CERTS)
    }

    console.debug(`Total certificates read: ${certificates.length}`)
    return certificates
}

/**
 * Creates an HTTPS agent configured with certificates and proxy settings if applicable.
 * The agent is configured to always validate certificates for secure communication.
 *
 * @returns {HttpsAgent | HttpsProxyAgent}
 */
function createSecureAgent(): HttpsAgent | HttpsProxyAgent {
    const certs = getCertificates()
    const agentOptions = {
        ca: certs,
        rejectUnauthorized: true, // Always validate certificates
    }

    const proxyUrl = getProxyUrl()

    if (proxyUrl) {
        console.log(`Using ${proxyUrl} HTTP proxy`)

        return new HttpsProxyAgent({
            ...agentOptions,
            proxy: proxyUrl,
        })
    }

    return new HttpsAgent(agentOptions)
}

/**
 * Creates configuration options for AWS SDK v2 clients with proxy and certificate settings.
 *
 * See also:
 * https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/node-configuring-proxies.html
 * https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/node-registering-certs.html
 *
 * @returns {ConfigurationOptions} AWS SDK v2 configuration object with httpOptions.agent configured
 */
export function createV2ProxyConfig(): ConfigurationOptions {
    const agent = createSecureAgent()
    return {
        httpOptions: {
            agent: agent,
        },
    }
}

/**
 * Creates a NodeHttpHandler for AWS SDK v3 clients with proxy and certificate settings.
 *
 * See also:
 * https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/node-configuring-proxies.html
 * https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/node-registering-certs.html
 *
 * @returns {NodeHttpHandler} Configured HTTP handler for AWS SDK v3 clients
 */
export function createV3ProxyConfig(): NodeHttpHandler {
    const agent = createSecureAgent()
    return new NodeHttpHandler({
        httpAgent: agent,
        httpsAgent: agent,
    })
}
