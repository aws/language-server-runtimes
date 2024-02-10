import {
    CompletionItem,
    CompletionList,
    CompletionParams,
    DidChangeConfigurationParams,
    DidChangeTextDocumentParams,
    DidCloseTextDocumentParams,
    ExecuteCommandParams,
    Hover,
    HoverParams,
    InitializeError,
    InitializeParams,
    InitializedParams,
    InlineCompletionItem,
    InlineCompletionList,
    InlineCompletionParams,
    LSPAny,
    NotificationHandler,
    PublishDiagnosticsParams,
    RequestHandler,
    ServerRequestHandler,
    ServerCapabilities,
    NotificationType,
} from 'vscode-languageserver'
import {
    InlineCompletionItemWithReferences,
    InlineCompletionListWithReferences,
    LogInlineCompletionSessionResultsParams,
} from './inline-completions/protocolExtensions'

export { observe } from './textDocuments/textDocumentConnection'

export type PartialServerCapabilities<T = any> = Pick<ServerCapabilities<T>, 'completionProvider' | 'hoverProvider'>
export type PartialInitializeResult<T = any> = {
    capabilities: PartialServerCapabilities<T>
}

// Using `RequestHandler` here from `vscode-languageserver-protocol` which doesn't support partial progress.
// If we want to support partial progress, we'll need to use `ServerRequestHandler` from `vscode-languageserver` instead.
// but if we can avoid exposing multiple different `vscode-languageserver-*` packages and package versions to
// implementors that would prevent potentially very hard to debug type mismatch errors (even on minor versions).
export type Lsp = {
    /**
     * Lsp#addInitializer allows servers to register handlers for the initilaze LSP request.
     * The handlers respond with PartialInitializeResult which includes a subset of InitializeResult's properties
     * as not all original properties are expected to be defined by servers.
     * Then the runtime will use the regiestered handlers and merge their responses when responding to initialize LSP request.
     *
     */
    addInitializer: (handler: RequestHandler<InitializeParams, PartialInitializeResult, InitializeError>) => void
    onInitialized: (handler: NotificationHandler<InitializedParams>) => void
    onInlineCompletion: (
        handler: RequestHandler<
            InlineCompletionParams,
            InlineCompletionItem[] | InlineCompletionList | undefined | null,
            void
        >
    ) => void
    onCompletion: (
        handler: RequestHandler<CompletionParams, CompletionItem[] | CompletionList | undefined | null, void>
    ) => void
    didChangeConfiguration: (handler: NotificationHandler<DidChangeConfigurationParams>) => void
    onDidChangeTextDocument: (handler: NotificationHandler<DidChangeTextDocumentParams>) => void
    onDidCloseTextDocument: (handler: NotificationHandler<DidCloseTextDocumentParams>) => void
    publishDiagnostics: (params: PublishDiagnosticsParams) => Promise<void>
    sendNotification: <P>(type: NotificationType<P>, params: P) => Promise<void>
    onHover: (handler: RequestHandler<HoverParams, Hover | null | undefined, void>) => void
    onExecuteCommand: (handler: RequestHandler<ExecuteCommandParams, any | undefined | null, void>) => void
    workspace: {
        getConfiguration: (section: string) => Promise<any>
    }
    extensions: {
        onInlineCompletionWithReferences: (
            handler: RequestHandler<
                InlineCompletionParams,
                InlineCompletionItemWithReferences[] | InlineCompletionListWithReferences | undefined | null,
                void
            >
        ) => void
        onLogInlineCompletionSessionResults: (
            handler: NotificationHandler<LogInlineCompletionSessionResultsParams>
        ) => void
    }
}
