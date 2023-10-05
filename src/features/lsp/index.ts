import {
  CompletionParams,
  CompletionList,
  RequestHandler,
  CompletionItem,
} from "vscode-languageserver-protocol";
import { InlineCompletionParams } from "./inline-completions/futureProtocol";
import {
  InlineCompletionItem,
  InlineCompletionList,
} from "./inline-completions/futureTypes";

// Using `RequestHandler` here from `vscode-languageserver-protocol` which doesn't support partial progress.
// If we want to support partial progress, we'll need to use `ServerRequestHandler` from `vscode-languageserver` instead.
// but if we can avoid exposing multiple different `vscode-languageserver-*` packages and package versions to
// implementors that would prevent potentially very hard to debug type mismatch errors (even on minor versions).
export type Lsp = {
  onInlineCompletion: (
    handler: RequestHandler<
      InlineCompletionParams,
      InlineCompletionItem[] | InlineCompletionList | undefined | null,
      void
    >,
  ) => void;
  onCompletion: (
    handler: RequestHandler<
      CompletionParams,
      CompletionItem[] | CompletionList | undefined | null,
      void
    >,
  ) => void;
};
