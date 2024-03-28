import {
    CancellationToken,
    ExecuteCommandParams,
    InitializeError,
    InitializeParams,
    RequestHandler,
    ResponseError,
    ServerRequestHandler,
    WorkDoneProgressReporter,
} from 'vscode-languageserver'
import { PartialInitializeResult, PartialServerCapabilities } from '../../../server-interface/lsp'
import { asPromise } from './util'

export class LspServer {
    private initializeHandler?: RequestHandler<InitializeParams, PartialInitializeResult, InitializeError>
    private executeCommandHandler?: RequestHandler<ExecuteCommandParams, any | undefined | null, void>
    private serverCapabilities?: PartialServerCapabilities

    public addInitializeHandler = (
        handler: RequestHandler<InitializeParams, PartialInitializeResult, InitializeError>
    ): void => {
        this.initializeHandler = handler
    }

    public addExecuteCommandHandler = (
        handler: RequestHandler<ExecuteCommandParams, any | undefined | null, void>
    ): void => {
        this.executeCommandHandler = handler
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
}
