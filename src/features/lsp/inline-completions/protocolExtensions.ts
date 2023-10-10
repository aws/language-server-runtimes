import {
  InlineCompletionItem,
  InlineCompletionParams,
  InlineCompletionRegistrationOptions,
  MessageDirection,
  Position,
  ProtocolNotificationType,
  ProtocolRequestType,
  TextDocumentPositionParams,
  VersionedTextDocumentIdentifier,
} from "vscode-languageserver";

export type InlineCompletionWithReferencesParams = InlineCompletionParams & {
  // No added parameters
};

/**
 * Extend InlineCompletionItem to include optional references.
 */
export type InlineCompletionItemWithReferences = InlineCompletionItem & {
  references?: {
    referenceName?: string;
    referenceUrl?: string;
    licenseName?: string;
    position?: {
      startCharacter?: number;
      endCharacter?: number;
    };
  }[];
};

/**
 * Extend InlineCompletionList to include optional references. This is not inheriting from `InlineCompletionList`
 * since the `items` arrays are incompatible.
 */
export type InlineCompletionListWithReferences = {
  /**
   * The inline completion items with optional references
   */
  items: InlineCompletionItemWithReferences[];
};

export const inlineCompletionWithReferencesRequestType =
  new ProtocolRequestType<
    InlineCompletionWithReferencesParams,
    | InlineCompletionListWithReferences
    | InlineCompletionItemWithReferences[]
    | null,
    InlineCompletionItemWithReferences[],
    void,
    InlineCompletionRegistrationOptions
  >("aws/textDocument/inlineCompletionWithReferences");

/**
 * A notification to trigger an inline completion, with reference information,
 * based on triggers from the language server itself. This suggests the client
 * to show an inline completion without the client explicitly asking about it.
 *
 * This can be used if the language server has its own triggers, based on file edits
 * or other criteria. The server will determine the amount of completions, and the rate
 * at which completions are suggested.
 *
 * It's up to the client to observe whether the inline completion is applicable
 * and to decide whether to show it.
 */
export type SuggestInlineCompletionsWithReferencesParams = {
  textDocument: VersionedTextDocumentIdentifier;
  position: Position;
  items: InlineCompletionItemWithReferences[];
};

export namespace SuggestInlineCompletionsWithReferences {
  export const method: "aws/textDocument/suggestInlineCompletionsWithReferences" =
    "aws/textDocument/suggestInlineCompletionsWithReferences";
  export const messageDirection: MessageDirection =
    MessageDirection.serverToClient;
  export const type = new ProtocolNotificationType<
    SuggestInlineCompletionsWithReferencesParams,
    void
  >(method);
}
