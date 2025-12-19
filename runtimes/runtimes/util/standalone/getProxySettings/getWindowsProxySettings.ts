/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on windows-system-proxy 1.0.0 (Apache-2.0). Modified for synchronous use
 * https://github.com/httptoolkit/windows-system-proxy/blob/main/src/index.ts
 */
import { enumerateValues, HKEY, RegistryValue } from 'registry-js'

export interface ProxyConfig {
    proxyUrl: string
    noProxy: string[]
}

export function getWindowsSystemProxy(): ProxyConfig | undefined {
    const proxyValues = enumerateValues(
        HKEY.HKEY_CURRENT_USER,
        'Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'
    )
    console.debug(`Retrieved ${proxyValues.length} registry values for proxy settings`)

    const proxyEnabled = getValue(proxyValues, 'ProxyEnable')
    const proxyServer = getValue(proxyValues, 'ProxyServer')

    if (!proxyEnabled || !proxyEnabled.data || !proxyServer || !proxyServer.data) {
        console.debug('Proxy not enabled or server not configured')
        return undefined
    }

    // Build noProxy list from ProxyOverride (semicolon-separated, with <local> → localhost,127.0.0.1,::1)
    const proxyOverride = getValue(proxyValues, 'ProxyOverride')?.data
    const noProxy = (proxyOverride ? (proxyOverride as string).split(';') : []).flatMap(host =>
        host === '<local>' ? ['localhost', '127.0.0.1', '::1'] : [host]
    )

    // Parse proxy configuration which can be in multiple formats
    const proxyConfigString = proxyServer.data as string

    if (proxyConfigString.startsWith('http://') || proxyConfigString.startsWith('https://')) {
        console.debug('Using full URL format proxy configuration')
        // Handle full URL format (documented in Microsoft registry configuration guide)
        // https://docs.microsoft.com/en-us/troubleshoot/windows-client/networking/configure-client-proxy-server-settings-by-registry-file
        return {
            proxyUrl: proxyConfigString,
            noProxy,
        }
    } else if (proxyConfigString.includes('=')) {
        console.debug('Using protocol-specific format proxy configuration')
        // Handle protocol-specific format: protocol=host;protocol=host pairs
        // Prefer HTTPS, then HTTP, then SOCKS proxy
        const proxies = Object.fromEntries(
            proxyConfigString.split(';').map(proxyPair => proxyPair.split('=') as [string, string])
        )

        const proxyUrl = proxies['https']
            ? `https://${proxies['https']}`
            : proxies['http']
              ? `http://${proxies['http']}`
              : // TODO: Enable support for SOCKS Proxy
                // proxies['socks'] ? `socks://${proxies['socks']}`:
                undefined

        if (!proxyUrl) {
            throw new Error(`Could not get usable proxy URL from ${proxyConfigString}`)
        }
        console.debug(`Selected proxy URL: ${proxyUrl}`)

        return {
            proxyUrl,
            noProxy,
        }
    } else {
        console.debug('Using bare hostname format, defaulting to HTTP')
        // Handle bare hostname format, default to HTTP
        return {
            proxyUrl: `http://${proxyConfigString}`,
            noProxy,
        }
    }
}

const getValue = (values: readonly RegistryValue[], name: string) => values.find(value => value?.name === name)
