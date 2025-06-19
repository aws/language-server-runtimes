import {
    InlineCompletionItem,
    InlineCompletionList,
    InlineCompletionParams,
    InlineCompletionRegistrationOptions,
} from './lsp'

import { ProtocolRequestType } from 'vscode-languageserver-protocol'

/**
 * inlineCompletionRequestType defines the custom method that the language client
 * requests from the server to provide inline completion recommendations.
 */
export const inlineCompletionRequestType = new ProtocolRequestType<
    InlineCompletionParams,
    InlineCompletionList | InlineCompletionItem[] | null,
    InlineCompletionItem[],
    void,
    InlineCompletionRegistrationOptions
>('aws/textDocument/inlineCompletion')
