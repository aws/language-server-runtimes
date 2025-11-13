var Registry = require('winreg')

export interface ProxyConfig {
    proxyUrl: string
    noProxy: string[]
}

export function getWindowsSystemProxy(): Promise<ProxyConfig | undefined> {
    const regKey = new Registry({
        hive: Registry.HKCU,
        key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
    })

    return new Promise((resolve, reject) => {
        Promise.all([
            new Promise(resolve => regKey.get('ProxyEnable', (_: any, item: any) => resolve(item?.value))),
            new Promise(resolve => regKey.get('ProxyServer', (_: any, item: any) => resolve(item?.value))),
            new Promise(resolve => regKey.get('ProxyOverride', (_: any, item: any) => resolve(item?.value))),
        ])
            .then(([proxyEnabled, proxyServer, proxyOverride]) => {
                if (!proxyEnabled || !proxyServer) {
                    resolve(undefined)
                    return
                }

                const noProxy = (proxyOverride ? String(proxyOverride).split(';') : []).flatMap(host =>
                    host === '<local>' ? ['localhost', '127.0.0.1', '::1'] : [host]
                )

                const proxyConfigString = String(proxyServer)
                let proxyUrl: string | undefined

                if (proxyConfigString.startsWith('http://') || proxyConfigString.startsWith('https://')) {
                    proxyUrl = proxyConfigString
                } else if (proxyConfigString.includes('=')) {
                    const proxies = Object.fromEntries(
                        proxyConfigString.split(';').map(proxyPair => proxyPair.split('=') as [string, string])
                    )
                    proxyUrl = proxies['https']
                        ? `https://${proxies['https']}`
                        : proxies['http']
                          ? `http://${proxies['http']}`
                          : undefined

                    if (!proxyUrl) {
                        reject(new Error(`Could not get usable proxy URL from ${proxyConfigString}`))
                        return
                    }
                } else {
                    proxyUrl = `http://${proxyConfigString}`
                }

                resolve({ proxyUrl, noProxy })
            })
            .catch(reject)
    })
}
