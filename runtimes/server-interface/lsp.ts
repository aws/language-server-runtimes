import {
    CompletionItem,
    CompletionList,
    CompletionParams,
    DidChangeConfigurationParams,
    DidChangeTextDocumentParams,
    DidChangeWorkspaceFoldersParams,
    DidCloseTextDocumentParams,
    DidOpenTextDocumentParams,
    DocumentFormattingParams,
    ExecuteCommandParams,
    Hover,
    HoverParams,
    InitializeError,
    InitializeParams as _ProtocolInitializeParams,
    InitializedParams,
    InlineCompletionItem,
    InlineCompletionItemWithReferences,
    InlineCompletionList,
    InlineCompletionListWithReferences,
    InlineCompletionParams,
    LogInlineCompletionSessionResultsParams,
    NotificationHandler,
    ProgressToken,
    ProgressType,
    PublishDiagnosticsParams,
    ChatOptions,
    RequestHandler,
    ServerCapabilities,
    TextEdit,
    SemanticTokensParams,
    SemanticTokens,
    SignatureHelp,
    SignatureHelpParams,
    ShowMessageParams,
    ShowMessageRequestParams,
    MessageActionItem,
    ShowDocumentParams,
    ShowDocumentResult,
} from '../protocol'

// Re-export whole surface of LSP protocol used in Runtimes.
// This is needed for LSP features as we pass messages down.
export * from '../protocol/lsp'

export type PartialServerCapabilities<T = any> = Pick<
    ServerCapabilities<T>,
    | 'completionProvider'
    | 'hoverProvider'
    | 'executeCommandProvider'
    | 'semanticTokensProvider'
    | 'signatureHelpProvider'
>
export type PartialInitializeResult<T = any> = {
    capabilities: PartialServerCapabilities<T>
    awsServerCapabilities?: {
        chatOptions?: ChatOptions
    }
}

/**
 * Extended InitializeParams passed to Capability Server implementation from Language Server Runtime.
 * Custom runtime metadata is mixed in to the data passed down from the client and is extended with shared data,
 * standardized in runtime implementation and shared by all servers.
 */
export interface InitializeParams extends _ProtocolInitializeParams {
    awsRuntimeMetadata?: {
        /**
         * Custom UserAgent value computed by the Runtime. Standard for all servers.
         * Suitable for setting predictable UserAgent for HTTP requests or configuring AWS SDK calls.
         */
        customUserAgent?: string
    }
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
    onDidFormatDocument: (
        handler: RequestHandler<DocumentFormattingParams, TextEdit[] | undefined | null, never>
    ) => void
    onDidOpenTextDocument: (handler: NotificationHandler<DidOpenTextDocumentParams>) => void
    onDidChangeTextDocument: (handler: NotificationHandler<DidChangeTextDocumentParams>) => void
    onDidCloseTextDocument: (handler: NotificationHandler<DidCloseTextDocumentParams>) => void
    publishDiagnostics: (params: PublishDiagnosticsParams) => Promise<void>
    sendProgress: <P>(type: ProgressType<P>, token: ProgressToken, value: P) => Promise<void>
    onHover: (handler: RequestHandler<HoverParams, Hover | null | undefined, void>) => void
    onExecuteCommand: (handler: RequestHandler<ExecuteCommandParams, any | undefined | null, void>) => void
    onSemanticTokens: (handler: RequestHandler<SemanticTokensParams, SemanticTokens | null, void>) => void
    onSignatureHelp: (handler: RequestHandler<SignatureHelpParams, SignatureHelp | null | undefined, void>) => void
    workspace: {
        getConfiguration: (section: string) => Promise<any>
        onDidChangeWorkspaceFolders: (handler: NotificationHandler<DidChangeWorkspaceFoldersParams>) => void
    }
    window: {
        showMessage: (params: ShowMessageParams) => Promise<void>
        showMessageRequest: (params: ShowMessageRequestParams) => Promise<MessageActionItem | null>
        showDocument: (params: ShowDocumentParams) => Promise<ShowDocumentResult>
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
