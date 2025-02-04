import { Workspace } from '../../server-interface'

import { ConfigurationOptions } from 'aws-sdk'
import { HttpsProxyAgent } from 'hpagent'
import { NodeHttpHandler } from '@smithy/node-http-handler'

// proxy configuration for sdk v2 clients
export const makeProxyConfigv2Standalone = (workspace: Workspace): ConfigurationOptions => {
    let additionalAwsConfig: ConfigurationOptions = {}
    const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy

    if (proxyUrl) {
        const certs = process.env.AWS_CA_BUNDLE ? [workspace.fs.readFileSync(process.env.AWS_CA_BUNDLE)] : undefined

        const agent = new HttpsProxyAgent({
            proxy: proxyUrl,
            ca: certs,
        })

        additionalAwsConfig = {
            httpOptions: {
                agent: agent,
            },
        }
    }

    return additionalAwsConfig
}

// proxy configuration for sdk v3 clients
export const makeProxyConfigv3Standalone = (workspace: Workspace): NodeHttpHandler | undefined => {
    const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy
    const certs = process.env.AWS_CA_BUNDLE ? [workspace.fs.readFileSync(process.env.AWS_CA_BUNDLE)] : undefined

    if (proxyUrl) {
        const agent = new HttpsProxyAgent({
            proxy: proxyUrl,
            ca: certs,
        })

        return new NodeHttpHandler({
            httpAgent: agent,
            httpsAgent: agent,
        })
    }
}
