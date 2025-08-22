/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on mac-system-proxy 1.0.2 (Apache-2.0). Modified for synchronous use
 * https://github.com/httptoolkit/mac-system-proxy/blob/main/src/index.ts
 */
import { spawnSync } from 'child_process'
import { parseScutilOutput } from './parseScutil'

export interface ProxyConfig {
    proxyUrl: string
    noProxy: string[]
}

export function getMacSystemProxy(): ProxyConfig | undefined {
    // Invoke `scutil --proxy` synchronously
    console.debug('Executing scutil --proxy to retrieve Mac system proxy settings')
    const result = spawnSync('scutil', ['--proxy'], { encoding: 'utf8' })
    if (result.error || result.status !== 0) {
        console.warn(`scutil --proxy failed: ${result.error?.message ?? 'exit code ' + result.status}`)
        return undefined
    }
    console.debug('Successfully retrieved scutil output')

    let settings: Record<string, any>
    try {
        settings = parseScutilOutput(result.stdout)
    } catch (e: any) {
        console.warn(`Failed to parse scutil output: ${e.message}`)
        return undefined
    }

    const noProxy = settings.ExceptionsList ?? []

    // Honor PAC URL first if configured
    if (settings.ProxyAutoConfigEnable === '1' && settings.ProxyAutoConfigURLString) {
        console.debug(`PAC URL detected: ${settings.ProxyAutoConfigURLString}`)
        // TODO: Parse PAC file to get actual proxy
        // For now, skip PAC and fall through to manual proxy settings
        console.warn('PAC file support not yet implemented, falling back to manual proxy settings')
    }

    // Otherwise pick the first enabled protocol
    console.debug('Checking for enabled proxy protocols')
    if (settings.HTTPEnable === '1' && settings.HTTPProxy && settings.HTTPPort) {
        console.debug(`Using HTTP proxy: ${settings.HTTPProxy}:${settings.HTTPPort}`)
        return { proxyUrl: `http://${settings.HTTPProxy}:${settings.HTTPPort}`, noProxy }
    }
    if (settings.HTTPSEnable === '1' && settings.HTTPSProxy && settings.HTTPSPort) {
        console.debug(`Using HTTPS proxy: ${settings.HTTPSProxy}:${settings.HTTPSPort}`)
        return { proxyUrl: `http://${settings.HTTPSProxy}:${settings.HTTPSPort}`, noProxy }
    }
    // TODO: Enable support for SOCKS Proxy
    // if (settings.SOCKSEnable === '1' && settings.SOCKSProxy && settings.SOCKSPort) {
    //     console.debug(`Using SOCKS proxy: ${settings.SOCKSProxy}:${settings.SOCKSPort}`)
    //     return { proxyUrl: `socks://${settings.SOCKSProxy}:${settings.SOCKSPort}`, noProxy }
    // }

    return undefined
}
