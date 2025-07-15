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

export type InlineCompletionWithReferencesParams = InlineCompletionParams & PartialResultParams & DocumentChangeParams

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
