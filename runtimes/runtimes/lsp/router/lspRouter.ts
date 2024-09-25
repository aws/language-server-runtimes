import {
    CancellationToken,
    ExecuteCommandParams,
    GetConfigurationFromServerParams,
    getConfigurationFromServerRequestType,
    InitializeError,
    InitializeParams,
    InitializeResult,
    ResponseError,
    TextDocumentSyncKind,
} from '../../../protocol'
import { Connection } from 'vscode-languageserver/node'
import { LspServer } from './lspServer'
import { mergeObjects } from './util'

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
        lspConnection.onRequest(getConfigurationFromServerRequestType, this.handleGetConfigurationFromServer)
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
        let responsesList = await Promise.all(this.servers.map(s => s.initialize(params, token)))
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

    handleGetConfigurationFromServer = async (params: GetConfigurationFromServerParams, token: CancellationToken) => {
        for (const s of this.servers) {
            const [executed, result] = await s.tryGetServerConfiguration(params, token)
            if (executed) {
                return result
            }
        }
    }
}
