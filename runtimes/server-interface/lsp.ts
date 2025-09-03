/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    CompletionItem,
    CompletionList,
    CompletionParams,
    ConfigurationOptions,
    DidChangeConfigurationParams,
    DidChangeTextDocumentParams,
    DidChangeWorkspaceFoldersParams,
    DidCloseTextDocumentParams,
    DidOpenTextDocumentParams,
    DocumentFormattingParams,
    ExecuteCommandParams,
    GetConfigurationFromServerParams,
    Hover,
    HoverParams,
    InitializeError,
    InitializeParams,
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
    LSPAny,
    ApplyWorkspaceEditParams,
    ApplyWorkspaceEditResult,
    DidSaveTextDocumentParams,
    DeleteFilesParams,
    CreateFilesParams,
    RenameFilesParams,
    DidChangeDependencyPathsParams,
    UpdateConfigurationParams,
    InlineCompletionWithReferencesParams,
    OpenFileDiffParams,
    SelectWorkspaceItemParams,
    SelectWorkspaceItemResult,
    ShowSaveFileDialogParams,
    ShowSaveFileDialogResult,
    ShowOpenDialogParams,
    ShowOpenDialogResult,
    CheckDiagnosticsParams,
    CheckDiagnosticsResult,
    OpenWorkspaceFileParams,
    OpenWorkspaceFileResult,
    GetSupplementalContextParams,
    SupplementalContextItem,
} from '../protocol'

// Re-export whole surface of LSP protocol used in Runtimes.
// This is needed for LSP features as we pass messages down.
export * from '../protocol/lsp'
export { GetConfigurationFromServerParams, UpdateConfigurationParams } from '../protocol'

export type PartialServerCapabilities<T = any> = Pick<
    ServerCapabilities<T>,
    | 'completionProvider'
    | 'hoverProvider'
    | 'executeCommandProvider'
    | 'semanticTokensProvider'
    | 'signatureHelpProvider'
    | 'workspace'
>
export type PartialInitializeResult<T = any> = {
    /**
     * Information about the server respresented by @type {Server}.
     * serverInfo is used to differentiate servers internally in the system and is not exposed to a client.
     */
    serverInfo?: {
        /**
         * The name is expect to be unique per server. It also has to be persistent/durable
         * across sessions and versions of application.
         */
        name: string
    }
    capabilities: PartialServerCapabilities<T>
    awsServerCapabilities?: {
        chatOptions?: ChatOptions
        configurationProvider?: ConfigurationOptions
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
    getClientInitializeParams: () => InitializeParams | undefined
    onInlineCompletion: (
        handler: RequestHandler<
            InlineCompletionParams,
            InlineCompletionItem[] | InlineCompletionList | undefined | null,
            void
        >
    ) => void
    onEditCompletion: (
        handler: RequestHandler<
            InlineCompletionParams,
            InlineCompletionItem[] | InlineCompletionList | undefined | null,
            void
        >
    ) => void
    onGetSupplementalContext: (
        handler: RequestHandler<GetSupplementalContextParams, SupplementalContextItem[] | undefined | null, void>
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
    onDidSaveTextDocument: (handler: NotificationHandler<DidSaveTextDocumentParams>) => void
    publishDiagnostics: (params: PublishDiagnosticsParams) => Promise<void>
    sendProgress: <P>(type: ProgressType<P>, token: ProgressToken, value: P) => Promise<void>
    onHover: (handler: RequestHandler<HoverParams, Hover | null | undefined, void>) => void
    onExecuteCommand: (handler: RequestHandler<ExecuteCommandParams, any | undefined | null, void>) => void
    onSemanticTokens: (handler: RequestHandler<SemanticTokensParams, SemanticTokens | null, void>) => void
    onSignatureHelp: (handler: RequestHandler<SignatureHelpParams, SignatureHelp | null | undefined, void>) => void
    workspace: {
        getConfiguration: (section: string) => Promise<any>
        onDidChangeWorkspaceFolders: (handler: NotificationHandler<DidChangeWorkspaceFoldersParams>) => void
        applyWorkspaceEdit: (params: ApplyWorkspaceEditParams) => Promise<ApplyWorkspaceEditResult>
        onDidCreateFiles: (handler: NotificationHandler<CreateFilesParams>) => void
        onDidDeleteFiles: (handler: NotificationHandler<DeleteFilesParams>) => void
        onDidRenameFiles: (handler: NotificationHandler<RenameFilesParams>) => void
        onUpdateConfiguration: (handler: RequestHandler<UpdateConfigurationParams, void, void>) => void
        selectWorkspaceItem: (
            handler: RequestHandler<SelectWorkspaceItemParams, SelectWorkspaceItemResult | undefined | null, void>
        ) => void
        openFileDiff: (params: OpenFileDiffParams) => void
        openWorkspaceFile: (params: OpenWorkspaceFileParams) => Promise<OpenWorkspaceFileResult>
    }
    window: {
        showMessage: (params: ShowMessageParams) => Promise<void>
        showMessageRequest: (params: ShowMessageRequestParams) => Promise<MessageActionItem | null>
        showDocument: (params: ShowDocumentParams) => Promise<ShowDocumentResult>
        showSaveFileDialog: (params: ShowSaveFileDialogParams) => Promise<ShowSaveFileDialogResult>
        showOpenDialog: (params: ShowOpenDialogParams) => Promise<ShowOpenDialogResult>
        checkDiagnostics: (params: CheckDiagnosticsParams) => Promise<CheckDiagnosticsResult>
    }
    extensions: {
        onInlineCompletionWithReferences: (
            handler: RequestHandler<
                InlineCompletionWithReferencesParams,
                InlineCompletionItemWithReferences[] | InlineCompletionListWithReferences | undefined | null,
                void
            >
        ) => void
        onEditCompletion: (
            handler: RequestHandler<
                InlineCompletionWithReferencesParams,
                InlineCompletionItemWithReferences[] | InlineCompletionListWithReferences | undefined | null,
                void
            >
        ) => void
        onLogInlineCompletionSessionResults: (
            handler: NotificationHandler<LogInlineCompletionSessionResultsParams>
        ) => void
        onGetConfigurationFromServer: (handler: RequestHandler<GetConfigurationFromServerParams, LSPAny, void>) => void
        onDidChangeDependencyPaths: (handler: NotificationHandler<DidChangeDependencyPathsParams>) => void
        onGetSupplementalContext: (
            handler: RequestHandler<GetSupplementalContextParams, SupplementalContextItem[] | undefined | null, void>
        ) => void
    }
}
