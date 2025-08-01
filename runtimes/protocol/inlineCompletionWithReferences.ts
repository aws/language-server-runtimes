import {
    InlineCompletionListWithReferences,
    InlineCompletionItemWithReferences,
    LogInlineCompletionSessionResultsParams,
    InlineCompletionRegistrationOptions,
    InlineCompletionParams,
    PartialResultParams,
} from './lsp'

import {
    DidChangeTextDocumentParams,
    ProtocolNotificationType,
    ProtocolRequestType,
} from 'vscode-languageserver-protocol'

interface DocumentChangeParams {
    documentChangeParams?: DidChangeTextDocumentParams
}

interface OpenTabParams {
    openTabFilepaths?: string
}

export type InlineCompletionWithReferencesParams = InlineCompletionParams &
    PartialResultParams &
    DocumentChangeParams &
    OpenTabParams

export const inlineCompletionWithReferencesRequestType = new ProtocolRequestType<
    InlineCompletionWithReferencesParams,
    InlineCompletionListWithReferences | InlineCompletionItemWithReferences[] | null,
    InlineCompletionItemWithReferences[],
    void,
    InlineCompletionRegistrationOptions
>('aws/textDocument/inlineCompletionWithReferences')

export const logInlineCompletionSessionResultsNotificationType = new ProtocolNotificationType<
    LogInlineCompletionSessionResultsParams,
    void
>('aws/logInlineCompletionSessionResults')
