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
} from '../../../protocol'
import { InitializeParams, PartialInitializeResult, PartialServerCapabilities } from '../../../server-interface/lsp'
import { asPromise } from './util'

export class LspServer {
    private didChangeConfigurationHandler?: NotificationHandler<DidChangeConfigurationParams>
    private executeCommandHandler?: RequestHandler<ExecuteCommandParams, any | undefined | null, void>
    private getServerConfigurationHandler?: RequestHandler<GetConfigurationFromServerParams, any, void>
    private initializeHandler?: RequestHandler<InitializeParams, PartialInitializeResult, InitializeError>
    private initializedHandler?: NotificationHandler<InitializedParams>
    private serverCapabilities?: PartialServerCapabilities
    private awsServerCapabilities?: PartialInitializeResult['awsServerCapabilities']

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
        if (!this.initializeHandler) {
            return
        }

        const initializeResult = await asPromise(this.initializeHandler(params, token))
        if (!(initializeResult instanceof ResponseError)) {
            this.serverCapabilities = initializeResult.capabilities
            this.awsServerCapabilities = initializeResult.awsServerCapabilities
        }

        return initializeResult
    }

    public tryExecuteCommand = async (
        params: ExecuteCommandParams,
        token: CancellationToken
    ): Promise<[boolean, any | undefined | null]> => {
        if (
            this.serverCapabilities?.executeCommandProvider?.commands.some(c => c === params.command) &&
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
            this.awsServerCapabilities?.configurationProvider?.sections.some(c => c === params.section) &&
            this.getServerConfigurationHandler
        ) {
            const result = await asPromise(this.getServerConfigurationHandler(params, token))
            return [true, result]
        }

        return [false, undefined]
    }

    public sendDidChangeConfigurationNotification = (params: DidChangeConfigurationParams): void => {
        if (this.didChangeConfigurationHandler) {
            this.didChangeConfigurationHandler(params)
        }
    }

    public sendInitializedNotification = (params: InitializedParams): void => {
        if (this.initializedHandler) {
            this.initializedHandler(params)
        }
    }
}
