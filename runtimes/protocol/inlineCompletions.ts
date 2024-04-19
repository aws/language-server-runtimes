import {
    InlineCompletionItem,
    InlineCompletionList,
    InlineCompletionParams,
    ProtocolRequestType,
    InlineCompletionRegistrationOptions,
} from './lsp'

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
