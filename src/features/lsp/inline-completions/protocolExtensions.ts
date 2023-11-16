import {
  InlineCompletionItem,
  InlineCompletionParams,
  InlineCompletionRegistrationOptions,
  ProtocolNotificationType,
  ProtocolRequestType,
} from "vscode-languageserver";

export type InlineCompletionWithReferencesParams = InlineCompletionParams & {
  // No added parameters
};

/**
 * Extend InlineCompletionItem to include optional references.
 */
export type InlineCompletionItemWithReferences = InlineCompletionItem & {
  /**
   * Identifier for the the recommendation returned by server.
   */
  itemId: string;

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
   * Server returns a session ID for current recommendation session.
   * Client need to attach this session ID in the request when sending
   * a completion session results.
   */
  sessionId: string;
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

export interface InlineCompletionStates {
  /**
   * Completion item was displayed in the client application UI.
   */
  seen: boolean;
  /**
   * Completion item was accepted.
   */
  accepted: boolean;
  /**
   * Recommendation was filtered out on the client-side and marked as discarded.
   */
  discarded: boolean;
}

export interface LogInlineCompletionSessionResultsParams {
  /**
   * Session Id attached to get completion items response.
   * This value must match to the one that server returned in InlineCompletionListWithReferences response.
   */
  sessionId: string;
  /**
   * Map with results of interaction with completion items in the client UI.
   * This list contain a state of each recommendation items from the recommendation session.
   */
  completionSessionResult: {
    [itemId: string /* Completion itemId */]: InlineCompletionStates;
  };
  /**
   * Time from completion request invocation start to rendering of the first recommendation in the UI.
   */
  firstCompletionDisplayLatency?: number;
  /**
   * Total time when items from this completion session were visible in UI
   */
  totalSessionDisplayTime?: number;
}

export const logInlineCompletionSessionResultsNotificationType =
  new ProtocolNotificationType<LogInlineCompletionSessionResultsParams, void>(
    "aws/logInlineCompletionSessionResults",
  );
