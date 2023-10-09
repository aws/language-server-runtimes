import {
  InlineCompletionItem,
  InlineCompletionParams,
  InlineCompletionRegistrationOptions,
  ProtocolRequestType,
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
