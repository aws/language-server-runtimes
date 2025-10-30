import { Workspace } from '../../../server-interface'

import { HttpsProxyAgent } from 'hpagent'
import { NodeHttpHandler } from '@smithy/node-http-handler'

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
