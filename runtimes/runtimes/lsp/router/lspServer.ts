/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    CancellationToken,
    DidChangeConfigurationParams,
    ExecuteCommandParams,
    GetConfigurationFromServerParams,
    InitializedParams,
    InitializeError,
    NotificationHandler,
    RequestHandler,
    ResponseError,
    showNotificationRequestType,
    NotificationFollowupParams,
    NotificationParams,
    ErrorCodes,
    UpdateConfigurationParams,
    HandlerResult,
    DidChangeWorkspaceFoldersParams,
    CreateFilesParams,
    DeleteFilesParams,
    RenameFilesParams,
    DidSaveTextDocumentParams,
} from '../../../protocol'
import { InitializeParams, PartialInitializeResult } from '../../../server-interface/lsp'
import { CredentialsType, Logging, Notification } from '../../../server-interface'
import { asPromise } from './util'
import { Connection } from 'vscode-languageserver/node'
import { RouterByServerName } from './routerByServerName'
import { Encoding } from '../../encoding'

export class LspServer {
    readonly notification: Notification

    private didChangeConfigurationHandler?: NotificationHandler<DidChangeConfigurationParams>
    private executeCommandHandler?: RequestHandler<ExecuteCommandParams, any | undefined | null, void>
    private getServerConfigurationHandler?: RequestHandler<GetConfigurationFromServerParams, any, void>
    private initializeHandler?: RequestHandler<InitializeParams, PartialInitializeResult, InitializeError>
    private initializedHandler?: NotificationHandler<InitializedParams>
    private updateConfigurationHandler?: RequestHandler<UpdateConfigurationParams, void, void>
    private credentialsDeleteHandler?: (type: CredentialsType) => void

    private clientSupportsNotifications?: boolean
    private initializeResult?: PartialInitializeResult

    private notificationRouter?: RouterByServerName<NotificationParams, NotificationFollowupParams>
    private notificationFollowupHandler?: NotificationHandler<NotificationFollowupParams>
    private didChangeWorkspaceFoldersHandler?: NotificationHandler<DidChangeWorkspaceFoldersParams>
    private didCreateFilesHandler?: NotificationHandler<CreateFilesParams>
    private didDeleteFilesHandler?: NotificationHandler<DeleteFilesParams>
    private didRenameFilesHandler?: NotificationHandler<RenameFilesParams>
    private didSaveTextDocumentHandler?: NotificationHandler<DidSaveTextDocumentParams>

    constructor(
        private lspConnection: Connection,
        private encoding: Encoding,
        private logger: Logging
    ) {
        this.notification = {
            showNotification: params => {
                if (this.clientSupportsNotifications) {
                    if (!this.notificationRouter) {
                        this.logger.log(`Notifications are not supported: serverInfo is not defined`)
                    }
                    this.notificationRouter?.send(
                        params => this.lspConnection.sendNotification(showNotificationRequestType.method, params),
                        params
                    )
                }
            },
            onNotificationFollowup: handler => {
                this.notificationFollowupHandler = handler
            },
        }
    }

    setCredentialsDeleteHandler = (handler: (type: CredentialsType) => void): void => {
        this.credentialsDeleteHandler = handler
    }

    public setInitializedHandler = (handler: NotificationHandler<InitializedParams>): void => {
        this.initializedHandler = handler
    }

    public setDidChangeConfigurationHandler = (handler: NotificationHandler<DidChangeConfigurationParams>): void => {
        this.didChangeConfigurationHandler = handler
    }

    public setUpdateConfigurationHandler = (handler: RequestHandler<UpdateConfigurationParams, void, void>): void => {
        this.updateConfigurationHandler = handler
    }

    public setInitializeHandler = (
        handler: RequestHandler<InitializeParams, PartialInitializeResult, InitializeError>
    ): void => {
        this.initializeHandler = handler
    }

    public setExecuteCommandHandler = (
        handler: RequestHandler<ExecuteCommandParams, any | undefined | null, void>
    ): void => {
        this.executeCommandHandler = handler
    }

    public setServerConfigurationHandler = (
        handler: RequestHandler<GetConfigurationFromServerParams, any, void>
    ): void => {
        this.getServerConfigurationHandler = handler
    }

    public setDidChangeWorkspaceFoldersHandler = (
        handler: NotificationHandler<DidChangeWorkspaceFoldersParams>
    ): void => {
        this.didChangeWorkspaceFoldersHandler = handler
    }

    public setDidCreateFilesHandler = (handler: NotificationHandler<CreateFilesParams>): void => {
        this.didCreateFilesHandler = handler
    }

    public setDidDeleteFilesHandler = (handler: NotificationHandler<DeleteFilesParams>): void => {
        this.didDeleteFilesHandler = handler
    }

    public setDidRenameFilesHandler = (handler: NotificationHandler<RenameFilesParams>): void => {
        this.didRenameFilesHandler = handler
    }

    public setDidSaveTextDocumentHandler = (handler: NotificationHandler<DidSaveTextDocumentParams>): void => {
        this.didSaveTextDocumentHandler = handler
    }

    public initialize = async (
        params: InitializeParams,
        token: CancellationToken
    ): Promise<PartialInitializeResult | ResponseError<InitializeError> | undefined> => {
        this.clientSupportsNotifications =
            params.initializationOptions?.aws?.awsClientCapabilities?.window?.notifications

        if (!this.initializeHandler) {
            return
        }
        try {
            const initializeResult = await asPromise(this.initializeHandler(params, token))
            if (!(initializeResult instanceof ResponseError)) {
                this.initializeResult = initializeResult
                if (initializeResult?.serverInfo) {
                    this.notificationRouter = new RouterByServerName(initializeResult.serverInfo.name, this.encoding)
                }
            }

            return initializeResult
        } catch (e) {
            this.logger.log(
                `Runtime Initialization Error\nInitializationOptions: ${JSON.stringify(params.initializationOptions)}\n${e}`
            )
            return new ResponseError(
                ErrorCodes.ServerNotInitialized,
                `Runtime Initialization Error\nInitializationOptions: ${JSON.stringify(params.initializationOptions)}\n${e}`
            )
        }
    }

    public tryExecuteCommand = async (
        params: ExecuteCommandParams,
        token: CancellationToken
    ): Promise<[boolean, any | undefined | null]> => {
        if (
            this.initializeResult?.capabilities?.executeCommandProvider?.commands.some(c => c === params.command) &&
            this.executeCommandHandler
        ) {
            const result = await asPromise(this.executeCommandHandler(params, token))
            return [true, result]
        }

        return [false, undefined]
    }

    public tryGetServerConfiguration = async (
        params: GetConfigurationFromServerParams,
        token: CancellationToken
    ): Promise<[boolean, any | undefined | null]> => {
        if (
            this.initializeResult?.awsServerCapabilities?.configurationProvider?.sections.some(
                c => c === params.section
            ) &&
            this.getServerConfigurationHandler
        ) {
            const result = await asPromise(this.getServerConfigurationHandler(params, token))
            return [true, result]
        }

        return [false, undefined]
    }

    public sendDidChangeConfigurationNotification = (params: DidChangeConfigurationParams): void => {
        this.didChangeConfigurationHandler?.(params)
    }

    public sendDidChangeWorkspaceFoldersNotification = (params: DidChangeWorkspaceFoldersParams): void => {
        this.didChangeWorkspaceFoldersHandler?.(params)
    }

    public sendDidCreateFilesNotification = (params: CreateFilesParams): void => {
        this.didCreateFilesHandler?.(params)
    }

    public sendDidDeleteFilesNotification = (params: DeleteFilesParams): void => {
        this.didDeleteFilesHandler?.(params)
    }

    public sendDidRenameFilesNotification = (params: RenameFilesParams): void => {
        this.didRenameFilesHandler?.(params)
    }

    public sendDidSaveTextDocumentNotification = (params: DidSaveTextDocumentParams): void => {
        this.didSaveTextDocumentHandler?.(params)
    }

    public sendUpdateConfigurationRequest = async (
        params: UpdateConfigurationParams,
        token: CancellationToken
    ): Promise<HandlerResult<void, void>> => {
        if (this.updateConfigurationHandler) {
            const result = await asPromise(this.updateConfigurationHandler?.(params, token))

            return result
        }
    }

    public sendInitializedNotification = (params: InitializedParams): void => {
        this.initializedHandler?.(params)
    }

    public sendNotificationFollowup = (params: NotificationFollowupParams): void => {
        if (this.notificationFollowupHandler && this.notificationRouter) {
            this.notificationRouter.processFollowup(this.notificationFollowupHandler, params)
        }
    }

    notifyCredentialsDeletion = (type: CredentialsType): void => {
        if (this.credentialsDeleteHandler) {
            this.credentialsDeleteHandler(type)
        }
    }
}
