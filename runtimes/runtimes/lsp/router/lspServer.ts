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
} from '../../../protocol'
import { InitializeParams, PartialInitializeResult, PartialServerCapabilities } from '../../../server-interface/lsp'
import { Logging, Notification } from '../../../server-interface'
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

    private clientSupportsNotifications?: boolean
    private initializeResult?: PartialInitializeResult

    private notificationRouter?: RouterByServerName<NotificationParams, NotificationFollowupParams>
    private notificationFollowupHandler?: NotificationHandler<NotificationFollowupParams>

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

    public setInitializedHandler = (handler: NotificationHandler<InitializedParams>): void => {
        this.initializedHandler = handler
    }

    public setDidChangeConfigurationHandler = (handler: NotificationHandler<DidChangeConfigurationParams>): void => {
        this.didChangeConfigurationHandler = handler
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

    public initialize = async (
        params: InitializeParams,
        token: CancellationToken
    ): Promise<PartialInitializeResult | ResponseError<InitializeError> | undefined> => {
        this.clientSupportsNotifications =
            params.initializationOptions?.aws.awsClientCapabilities?.window?.notifications

        if (!this.initializeHandler) {
            return
        }

        const initializeResult = await asPromise(this.initializeHandler(params, token))
        if (!(initializeResult instanceof ResponseError)) {
            this.initializeResult = initializeResult
            if (initializeResult?.serverInfo) {
                this.notificationRouter = new RouterByServerName(initializeResult.serverInfo.name, this.encoding)
            }
        }

        return initializeResult
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

    public sendInitializedNotification = (params: InitializedParams): void => {
        this.initializedHandler?.(params)
    }

    public sendNotificationFollowup = (params: NotificationFollowupParams): void => {
        if (this.notificationFollowupHandler && this.notificationRouter) {
            this.notificationRouter.processFollowup(this.notificationFollowupHandler, params)
        }
    }
}
