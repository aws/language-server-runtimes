import {
    AWSClientInitializationOptions,
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

    getUserAgent = (opts: AWSClientInitializationOptions = {}): string => {
        const items: String[] = []

        // Standard prefix for all Language Server Runtimes artifacts
        items.push(USER_AGENT_PREFIX)

        // Fields specific to runtime artifact
        if (this.version) {
            items.push(`${this.name}/${this.version}`)
        } else {
            items.push(`${this.name}`)
        }

        // Compute client-specific suffix
        if (opts.customUserAgentSuffix) {
            items.push(opts.customUserAgentSuffix)
        }

        return items.join(' ')
    }
}
