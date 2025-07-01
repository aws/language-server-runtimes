/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

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
    UpdateConfigurationParams,
    updateConfigurationRequestType,
    HandlerResult,
    WorkspaceFolder,
    DidChangeWorkspaceFoldersParams,
    WorkspaceFoldersChangeEvent,
    CreateFilesParams,
    DeleteFilesParams,
    RenameFilesParams,
    DidSaveTextDocumentParams,
    DidChangeWorkspaceFoldersNotification,
} from '../../../protocol'
import { Connection } from 'vscode-languageserver/node'
import { LspServer } from './lspServer'
import { findDuplicates, mergeObjects } from './util'
import { CredentialsType, PartialInitializeResult } from '../../../server-interface'
import { SERVER_CAPABILITES_CONFIGURATION_SECTION } from './constants'
import { getWorkspaceFoldersFromInit } from './initializeUtils'

export class LspRouter {
    private initializeResult?: InitializeResult
    public clientInitializeParams?: InitializeParams
    public servers: LspServer[] = []
    private workspaceFolders: WorkspaceFolder[] = []

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
        lspConnection.onRequest(updateConfigurationRequestType, this.updateConfiguration)
        lspConnection.workspace.onDidCreateFiles(this.didCreateFiles)
        lspConnection.workspace.onDidDeleteFiles(this.didDeleteFiles)
        lspConnection.workspace.onDidRenameFiles(this.didRenameFiles)
        // Note: Using raw notification instead of workspace.OnDidWorkspaceChange to avoid downstream VSCode language server errors when workspaceFolders is undefined(clients like VS)
        lspConnection.onNotification(DidChangeWorkspaceFoldersNotification.type, params => {
            this.didChangeWorkspaceFolders(params.event)
        })
        lspConnection.onDidSaveTextDocument(this.didSaveTextDocument)
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

            this.lspConnection.console.log(
                `Unknown initialization error\nwith initialization options: ${JSON.stringify(params.initializationOptions)}`
            )
        }

        this.workspaceFolders = getWorkspaceFoldersFromInit(this.lspConnection.console, params)

        if (this.workspaceFolders.length === 0) {
            this.lspConnection.console.info('No workspace folders found in initialization parameters')
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
        this.initializeResult = result
        this.lspConnection.console.info(
            `Runtime: Initializing server ${JSON.stringify(result.serverInfo?.name)} version ${JSON.stringify(result.serverInfo?.version)} with capabilities:
${JSON.stringify({ ...result.capabilities, ...result.awsServerCapabilities })}`
        )

        return result
    }

    didChangeWorkspaceFolders = (event: WorkspaceFoldersChangeEvent): void => {
        this.workspaceFolders = this.workspaceFolders.filter(
            folder => !event.removed.some(removed => removed.uri === folder.uri)
        )
        this.workspaceFolders.push(
            ...event.added.filter(
                added =>
                    !this.workspaceFolders.some(
                        existing => existing.uri.replace(/\/$/, '') === added.uri.replace(/\/$/, '')
                    )
            )
        )
        const params: DidChangeWorkspaceFoldersParams = { event }

        this.routeNotificationToAllServers((server, params) => {
            if (server.sendDidChangeWorkspaceFoldersNotification) {
                server.sendDidChangeWorkspaceFoldersNotification(params)
            }
        }, params)
    }

    getAllWorkspaceFolders(): WorkspaceFolder[] {
        return this.workspaceFolders
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
        if (params.section === SERVER_CAPABILITES_CONFIGURATION_SECTION) {
            return this.initializeResult?.awsServerCapabilities
        }
        return this.routeRequestToFirstCapableServer(
            (server, params, token) => server.tryGetServerConfiguration(params, token),
            params,
            token
        )
    }

    updateConfiguration = async (params: UpdateConfigurationParams, token: CancellationToken) => {
        const results = await this.routeRequestToAllServers(
            (server, params, token) => server.sendUpdateConfigurationRequest(params, token),
            params,
            token
        )

        const errors = results.filter(result => result instanceof ResponseError)

        if (errors.length > 0) {
            errors.forEach(error => {
                this.lspConnection.console.log(
                    `Error updating configration section ${params.section}: ${error.message}`
                )
            })

            return new ResponseError(ErrorCodes.InternalError, 'Error during updating configuration', errors)
        }

        // Update configuration succeeded.
        return null
    }

    didChangeConfiguration = (params: DidChangeConfigurationParams): void => {
        this.routeNotificationToAllServers(
            (server, params) => server.sendDidChangeConfigurationNotification(params),
            params
        )
    }

    onCredentialsDeletion = (type: CredentialsType): void => {
        this.routeNotificationToAllServers((server, type) => server.notifyCredentialsDeletion(type), type)
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

    didCreateFiles = (params: CreateFilesParams): void => {
        this.routeNotificationToAllServers((server, params) => server.sendDidCreateFilesNotification(params), params)
    }

    didDeleteFiles = (params: DeleteFilesParams): void => {
        this.routeNotificationToAllServers((server, params) => server.sendDidDeleteFilesNotification(params), params)
    }

    didRenameFiles = (params: RenameFilesParams): void => {
        this.routeNotificationToAllServers((server, params) => server.sendDidRenameFilesNotification(params), params)
    }

    didSaveTextDocument = (params: DidSaveTextDocumentParams): void => {
        this.routeNotificationToAllServers(
            (server, params) => server.sendDidSaveTextDocumentNotification(params),
            params
        )
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
        return undefined
    }

    private async routeNotificationToAllServers<P>(action: (server: LspServer, params: P) => void, params: P) {
        for (const server of this.servers) {
            action(server, params)
        }
    }

    /**
     * Routes a single request to all registered LSP servers and collects their responses.
     */
    private async routeRequestToAllServers<P, R, E>(
        action: (server: LspServer, params: P, token: CancellationToken) => Promise<HandlerResult<R, E>>,
        params: P,
        token: CancellationToken
    ): Promise<HandlerResult<R, E>[]> {
        const responses = await Promise.all(this.servers.map(s => action(s, params, token)))

        return responses
    }
}
