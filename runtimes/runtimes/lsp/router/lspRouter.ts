import {
    CancellationToken,
    DidChangeConfigurationNotification,
    DidChangeConfigurationParams,
    ErrorCodes,
    ExecuteCommandParams,
    GetConfigurationFromServerParams,
    getConfigurationFromServerRequestType,
    InitializedParams,
    InitializeError,
    InitializeParams,
    InitializeResult,
    ResponseError,
    TextDocumentSyncKind,
} from '../../../protocol'
import { Connection } from 'vscode-languageserver/node'
import { LspServer } from './lspServer'
import { findDuplicates, mergeObjects } from './util'
import { PartialInitializeResult } from '../../../server-interface'

export class LspRouter {
    public clientInitializeParams?: InitializeParams
    public servers: LspServer[] = []

    constructor(
        private lspConnection: Connection,
        private name: string,
        private version?: string
    ) {
        lspConnection.onDidChangeConfiguration(this.didChangeConfiguration)
        lspConnection.onExecuteCommand(this.executeCommand)
        lspConnection.onInitialize(this.initialize)
        lspConnection.onInitialized(this.onInitialized)
        lspConnection.onRequest(getConfigurationFromServerRequestType, this.getConfigurationFromServer)
    }

    public get clientSupportsNotifications() {
        return (
            this.clientInitializeParams?.initializationOptions?.aws.awsClientCapabilities?.window?.notifications ??
            false
        )
    }

    initialize = async (
        params: InitializeParams,
        token: CancellationToken
    ): Promise<InitializeResult | ResponseError<InitializeError>> => {
        this.clientInitializeParams = params

        let responsesList = await Promise.all(this.servers.map(s => s.initialize(params, token)))
        responsesList = responsesList.filter(r => r != undefined)
        const responseError = responsesList.find(el => el instanceof ResponseError)
        if (responseError) {
            return responseError as ResponseError<InitializeError>
        }
        const dupServerNames = findDuplicates(responsesList.map(r => (r as PartialInitializeResult).serverInfo?.name))
        if (dupServerNames) {
            return new ResponseError(
                ErrorCodes.InternalError,
                `Duplicate servers defined: ${dupServerNames.join(', ')}`
            )
        }

        const resultList = responsesList as InitializeResult[]
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
        resultList.unshift(defaultResponse)

        return resultList.reduceRight((acc, curr) => {
            return mergeObjects(acc, curr)
        })
    }

    executeCommand = async (
        params: ExecuteCommandParams,
        token: CancellationToken
    ): Promise<any | undefined | null> => {
        return this.routeRequestToFirstCapableServer(
            (server, params, token) => server.tryExecuteCommand(params, token),
            params,
            token
        )
    }

    getConfigurationFromServer = async (params: GetConfigurationFromServerParams, token: CancellationToken) => {
        return this.routeRequestToFirstCapableServer(
            (server, params, token) => server.tryGetServerConfiguration(params, token),
            params,
            token
        )
    }

    didChangeConfiguration = (params: DidChangeConfigurationParams): void => {
        this.routeNotificationToAllServers(
            (server, params) => server.sendDidChangeConfigurationNotification(params),
            params
        )
    }

    onInitialized = (params: InitializedParams): void => {
        const workspaceCapabilities = this.clientInitializeParams?.capabilities.workspace
        if (workspaceCapabilities?.didChangeConfiguration?.dynamicRegistration) {
            // Ask the client to notify the server on configuration changes
            this.lspConnection.client.register(DidChangeConfigurationNotification.type, undefined)
        }

        this.routeNotificationToAllServers((server, params) => server.sendInitializedNotification(params), params)
    }

    private async routeRequestToFirstCapableServer<P, R>(
        action: (server: LspServer, params: P, token: CancellationToken) => Promise<[boolean, R | null | undefined]>,
        params: P,
        token: CancellationToken
    ): Promise<R | null | undefined> {
        for (const server of this.servers) {
            const [executed, result] = await action(server, params, token)
            if (executed) {
                return result
            }
        }
    }

    private async routeNotificationToAllServers<P>(action: (server: LspServer, params: P) => void, params: P) {
        for (const server of this.servers) {
            action(server, params)
        }
    }
}
