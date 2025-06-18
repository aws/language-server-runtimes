import {
    InlineCompletionListWithReferences,
    InlineCompletionItemWithReferences,
    LogInlineCompletionSessionResultsParams,
    InlineCompletionRegistrationOptions,
    InlineCompletionParams,
    PartialResultParams,
} from './lsp'

import { ProtocolNotificationType, ProtocolRequestType } from 'vscode-languageserver-protocol'

export type InlineCompletionWithReferencesParams = InlineCompletionParams & PartialResultParams

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
