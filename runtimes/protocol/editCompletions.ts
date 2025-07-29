import {
    InlineCompletionItem,
    InlineCompletionList,
    InlineCompletionParams,
    InlineCompletionRegistrationOptions,
} from './lsp'

import { ProtocolRequestType } from 'vscode-languageserver-protocol'

export const editCompletionRequestType = new ProtocolRequestType<
    InlineCompletionParams,
    InlineCompletionList | InlineCompletionItem[] | null,
    InlineCompletionItem[],
    void,
    InlineCompletionRegistrationOptions
>('aws/textDocument/editCompletion')
