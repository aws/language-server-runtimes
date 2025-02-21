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
    notificationFollowupRequestType,
    NotificationFollowupParams,
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
        lspConnection.onNotification(notificationFollowupRequestType, this.onNotificationFollowup)
    }

    initialize = async (
        params: InitializeParams,
        token: CancellationToken
    ): Promise<InitializeResult | ResponseError<InitializeError>> => {
        this.clientInitializeParams = params

        if (!params.initializationOptions?.aws) {
            this.lspConnection.telemetry.logEvent({
                name: 'runtimeInitialization_validation',
                result: 'Failed',
                data: {
                    hasAwsConfig: Boolean(params.initializationOptions?.aws),
                    logLevel: params.initializationOptions?.logLevel,
                    initializationOptionsStr: JSON.stringify(params.initializationOptions),
                },
                errorData: {
                    reason: 'aws field is not defined in InitializeResult',
                },
            })
        }

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
                    save: {
                        includeText: true,
                    },
                },
            },
        }
        resultList.unshift(defaultResponse)
        const result = resultList.reduceRight((acc, curr) => {
            return mergeObjects(acc, curr)
        })
        this.lspConnection.console.info(
            `Runtime: Initializing server ${JSON.stringify(result.serverInfo?.name)} version ${JSON.stringify(result.serverInfo?.version)} with capabilities:
${JSON.stringify({ ...result.capabilities, ...result.awsServerCapabilities })}`
        )

        return result
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

    onNotificationFollowup = (params: NotificationFollowupParams): void => {
        this.routeNotificationToAllServers((server, params) => server.sendNotificationFollowup(params), params)
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
