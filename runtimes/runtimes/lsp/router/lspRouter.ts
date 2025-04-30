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
} from '../../../protocol'
import { Connection } from 'vscode-languageserver/node'
import { LspServer } from './lspServer'
import { findDuplicates, mergeObjects } from './util'
import { CredentialsType, PartialInitializeResult } from '../../../server-interface'

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
        lspConnection.onRequest(updateConfigurationRequestType, this.updateConfiguration)
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

        let responsesList = await Promise.all(this.servers.map(s => s.initialize(params, token)))
        responsesList = responsesList.filter(r => r !== undefined)
        const responseError = responsesList.find(el => el instanceof ResponseError)
        if (responseError) {
            return responseError
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

    executeCommand = async (params: ExecuteCommandParams, token: CancellationToken): Promise<any> => {
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

    updateConfiguration = async (params: UpdateConfigurationParams, token: CancellationToken) => {
        const results = await this.routeRequestToAllServers(
            (server, params, token) => server.sendUpdateConfigurationRequest(params, token),
            params,
            token
        )

        const errors = results.filter(result => result instanceof ResponseError)

        if (errors.length > 0) {
            for (const error of errors) {
                this.lspConnection.console.log(
                    `Error updating configration section ${params.section}: ${error.message}`
                )
            }

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
            this.lspConnection.client
                .register(DidChangeConfigurationNotification.type, undefined)
                .then(() => {})
                .catch(() => {})
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

    private routeNotificationToAllServers<P>(action: (server: LspServer, params: P) => void, params: P) {
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
