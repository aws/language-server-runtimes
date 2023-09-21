import { CancellationToken, CompletionParams } from "vscode-languageserver";

import { CompletionList } from "vscode-languageserver-types";
import { InlineCompletionParams } from "./inline-completions/futureProtocol";
import { InlineCompletionList } from "./inline-completions/futureTypes";

export type Lsp = {
  onInlineCompletion: (
    handler: (
      params: InlineCompletionParams,
      token: CancellationToken,
    ) => Promise<InlineCompletionList | null | undefined>,
  ) => void;
  onCompletion: (
    handler: (
      params: CompletionParams,
      token: CancellationToken,
    ) => Promise<CompletionList | null | undefined>,
  ) => void;
};
