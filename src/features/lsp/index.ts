import {
  CompletionItem,
  CompletionList,
  CompletionParams,
  DidChangeConfigurationParams,
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  InitializedParams,
  InlineCompletionItem,
  InlineCompletionList,
  InlineCompletionParams,
  NotificationHandler,
  RequestHandler,
} from "vscode-languageserver";
import {
  InlineCompletionItemWithReferences,
  InlineCompletionListWithReferences,
  LogInlineCompelitionSessionResultsParams,
} from "./inline-completions/protocolExtensions";

export { observe } from "./textDocuments/textDocumentConnection";

// Using `RequestHandler` here from `vscode-languageserver-protocol` which doesn't support partial progress.
// If we want to support partial progress, we'll need to use `ServerRequestHandler` from `vscode-languageserver` instead.
// but if we can avoid exposing multiple different `vscode-languageserver-*` packages and package versions to
// implementors that would prevent potentially very hard to debug type mismatch errors (even on minor versions).
export type Lsp = {
  onInitialized: (handler: NotificationHandler<InitializedParams>) => void;
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
  didChangeConfiguration: (
    handler: NotificationHandler<DidChangeConfigurationParams>,
  ) => void;
  onDidChangeTextDocument: (
    handler: NotificationHandler<DidChangeTextDocumentParams>,
  ) => void;
  onDidCloseTextDocument: (
    handler: NotificationHandler<DidCloseTextDocumentParams>,
  ) => void;
  workspace: {
    getConfiguration: (section: string) => Promise<any>;
  };
  extensions: {
    onInlineCompletionWithReferences: (
      handler: RequestHandler<
        InlineCompletionParams,
        | InlineCompletionItemWithReferences[]
        | InlineCompletionListWithReferences
        | undefined
        | null,
        void
      >,
    ) => void;
    onLogInlineCompelitionSessionResults: (
      handler: NotificationHandler<LogInlineCompelitionSessionResultsParams>,
    ) => void;
  };
};
