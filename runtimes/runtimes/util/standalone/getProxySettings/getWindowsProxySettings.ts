/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on windows-system-proxy 1.0.0 (Apache-2.0). Modified for synchronous use
 * https://github.com/httptoolkit/windows-system-proxy/blob/main/src/index.ts
 */
import winreg from 'winreg'

export interface ProxyConfig {
    proxyUrl: string
    noProxy: string[]
}

const KEY_PROXY_ENABLE = 'ProxyEnable'
const KEY_PROXY_SERVER = 'ProxyServer'
const KEY_PROXY_OVERRIDE = 'ProxyOverride'

type WindowsProxyRegistryKeys = {
    proxyEnable: string | undefined
    proxyServer: string | undefined
    proxyOverride: string | undefined
}

function readWindowsRegistry(): Promise<WindowsProxyRegistryKeys> {
    return new Promise((resolve, reject) => {
        const regKey = new winreg({
            hive: winreg.HKCU,
            key: 'Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
        })

        regKey.values((err: Error, items: winreg.RegistryItem[]) => {
            if (err) {
                console.warn('', err.message)
                resolve({
                    proxyEnable: undefined,
                    proxyServer: undefined,
                    proxyOverride: undefined,
                })
                return
            }

            const results: Record<string, string> = {}

            items.forEach((item: winreg.RegistryItem) => {
                results[item.name] = item.value as string
            })

            resolve({
                proxyEnable: results[KEY_PROXY_ENABLE],
                proxyServer: results[KEY_PROXY_SERVER],
                proxyOverride: results[KEY_PROXY_OVERRIDE],
            })
        })
    })
}

export async function getWindowsSystemProxy(): Promise<ProxyConfig | undefined> {
    const registryValues = await readWindowsRegistry()
    const proxyEnabled = registryValues.proxyEnable
    const proxyServer = registryValues.proxyServer
    const proxyOverride = registryValues.proxyOverride

    if (!proxyEnabled || !proxyServer) {
        console.debug('Proxy not enabled or server not configured')
        return undefined
    }

    const noProxy = (proxyOverride ? (proxyOverride as string).split(';') : []).flatMap(host =>
        host === '<local>' ? ['localhost', '127.0.0.1', '::1'] : [host]
    )

    // Parse proxy configuration which can be in multiple formats
    const proxyConfigString = proxyServer

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
