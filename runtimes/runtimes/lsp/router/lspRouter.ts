import {
    AWSClientInfoInitializationOptions,
    AWSInitializationOptions,
    CancellationToken,
    ExecuteCommandParams,
    InitializeError,
    InitializeParams,
    InitializeResult,
    ResponseError,
    TextDocumentSyncKind,
} from '../../../protocol'
import { Connection } from 'vscode-languageserver/node'
import { LspServer } from './lspServer'
import { mergeObjects } from './util'

const USER_AGENT_PREFIX = 'AWS-Language-Servers'

export class LspRouter {
    public clientInitializeParams?: InitializeParams
    public servers: LspServer[] = []

    constructor(
        lspConnection: Connection,
        private name: string,
        private version?: string
    ) {
        lspConnection.onInitialize(this.initialize)
        lspConnection.onExecuteCommand(this.executeCommand)
    }

    initialize = async (
        params: InitializeParams,
        token: CancellationToken
    ): Promise<InitializeResult | ResponseError<InitializeError>> => {
        this.clientInitializeParams = params
        const defaultResponse: InitializeResult = {
            serverInfo: {
                name: this.name,
                version: this.version,
            },
            capabilities: {
                textDocumentSync: {
                    openClose: true,
                    change: TextDocumentSyncKind.Incremental,
                },
            },
        }

        let responsesList = await Promise.all(
            this.servers.map(s =>
                s.initialize(
                    {
                        ...params,
                        awsRuntimeMetadata: {
                            customUserAgent: this.getUserAgent(params.initializationOptions?.aws),
                        },
                    },
                    token
                )
            )
        )
        responsesList = responsesList.filter(r => r != undefined)
        if (responsesList.some(el => el instanceof ResponseError)) {
            return responsesList.find(el => el instanceof ResponseError) as ResponseError<InitializeError>
        }
        const resultList = responsesList as InitializeResult[]
        resultList.unshift(defaultResponse)
        return resultList.reduceRight((acc, curr) => {
            return mergeObjects(acc, curr)
        })
    }

    executeCommand = async (
        params: ExecuteCommandParams,
        token: CancellationToken
    ): Promise<any | undefined | null> => {
        for (const s of this.servers) {
            const [executed, result] = await s.tryExecuteCommand(params, token)
            if (executed) {
                return result
            }
        }
    }

    getUserAgent = (opts?: AWSInitializationOptions): string => {
        const format = (s: string) => s.replace(/\s/g, '-')

        const items: String[] = []

        // Standard prefix for all Language Server Runtimes artifacts
        items.push(USER_AGENT_PREFIX)

        // Fields specific to runtime artifact
        if (this.version) {
            items.push(`${format(this.name)}/${this.version}`)
        } else {
            items.push(format(this.name))
        }

        // Compute client-specific suffix
        // Missing required data fields are replaced with 'UNKNOWN' token
        // Whitespaces in product.name and platform.name are replaced to '-'
        const { clientInfo: client, platformInfo: platform } = opts || {}

        if (client) {
            items.push(`${client.name ? format(client.name) : 'UNKNOWN'}/${client.version || 'UNKNOWN'}`)
        }

        if (platform) {
            items.push(`${platform.name ? format(platform.name) : 'UNKNOWN'}/${platform.version || 'UNKNOWN'}`)
        }

        if (client?.clientId) {
            items.push(`ClientId/${client?.clientId}`)
        }

        return items.join(' ')
    }
}
