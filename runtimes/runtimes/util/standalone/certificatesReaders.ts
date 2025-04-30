/* eslint-disable @typescript-eslint/no-var-requires */
/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { OperationalTelemetryProvider, TELEMETRY_SCOPES } from '../../operational-telemetry/operational-telemetry'

const UNIX_CERT_FILES = [
    '/etc/ssl/certs/ca-certificates.crt',
    '/etc/pki/tls/certs/ca-bundle.crt',
    '/etc/ssl/ca-bundle.pem',
    '/etc/pki/tls/cacert.pem',
    '/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem',
    '/etc/ssl/cert.pem',
]

const UNIX_CERT_DIRS = ['/etc/ssl/certs', '/etc/pki/tls/certs', '/system/etc/security/cacerts']

const PEM_CERT_REGEXP = /-----BEGIN\s+CERTIFICATE-----[\s\S]+?-----END\s+CERTIFICATE-----$/gm

export function readLinuxCertificates(): string[] {
    const allFiles = [...UNIX_CERT_FILES]
    const certificates: string[] = []
    let firstError: Error | undefined
    let hasSeenCertificate = false

    // Step 1: Collect all certificate files from directories
    for (const dir of UNIX_CERT_DIRS) {
        try {
            const dirFiles = readdirSync(dir).map(file => path.join(dir, file))
            allFiles.push(...dirFiles)
        } catch (error: any) {
            firstError ??= error
        }
    }

    // Step 2: Extract certificates from all collected files
    for (const file of allFiles) {
        try {
            const content = readFileSync(file, 'utf8')
            const matches = content.match(PEM_CERT_REGEXP)

            // Skip if no certificates found in this file
            if (!matches) {
                continue
            }

            // Track if we've found any valid certificates
            hasSeenCertificate = hasSeenCertificate || matches.length > 0

            // Add trimmed certificates to our collection
            const validCertificates = matches.map(cert => cert.trim())
            certificates.push(...validCertificates)
        } catch (error: any) {
            firstError ??= error
        }
    }

    // Step 3: Handle errors and return results
    if (!hasSeenCertificate && firstError) {
        const errorMessage = 'Error when reading Linux certificates'
        console.log(errorMessage)
        OperationalTelemetryProvider.getTelemetryForScope(TELEMETRY_SCOPES.RUNTIMES).recordEvent('ErrorEvent', {
            errorOrigin: 'caughtError',
            errorName: firstError?.name ?? 'unknown',
            errorType: 'linuxCertificateReader',
            errorMessage: errorMessage,
        })
        console.error(firstError)
        return []
    }

    return certificates
}

export function readWindowsCertificates(): string[] {
    const winCaReader = require('win-ca')
    const certs: string[] = []

    winCaReader({
        store: ['root', 'ca'],
        format: winCaReader.der2.pem,
        ondata: (crt: string) => certs.push(crt),
    })

    return certs
}

export function readMacosCertificates(): string[] {
    const macCertsReader = require('mac-ca')

    const certs: string[] = macCertsReader.get({
        excludeBundled: false,
    })

    return certs
}
