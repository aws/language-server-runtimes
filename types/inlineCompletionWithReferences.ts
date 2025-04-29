import { InlineCompletionItem } from 'vscode-languageserver-types'

/**
 * Extend InlineCompletionItem to include optional references and imports.
 */
export type InlineCompletionItemWithReferences = InlineCompletionItem & {
    /**
     * Identifier for the the recommendation returned by server.
     */
    itemId: string

    /**
     * POC-NEP: Flag to indicate if this is an edit suggestion rather than an inline completion.
     * When true, the client should render this as an edit suggestion using the VSCode proposed API.
     * This is used by the Next Edit Prediction feature to distinguish between inline completions
     * and edit suggestions.
     */
    isEdit?: boolean

    references?: {
        referenceName?: string
        referenceUrl?: string
        licenseName?: string
        position?: {
            startCharacter?: number
            endCharacter?: number
        }
    }[]

    mostRelevantMissingImports?: {
        statement?: string
    }[]
}
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
    sessionId: string
    /**
     * The inline completion items with optional references
     */
    items: InlineCompletionItemWithReferences[]
    /**
     * Server returns partialResultToken for client to request next set of results
     */
    partialResultToken?: number | string
}

export interface InlineCompletionStates {
    /**
     * Completion item was displayed in the client application UI.
     */
    seen: boolean
    /**
     * Completion item was accepted.
     */
    accepted: boolean
    /**
     * Recommendation was filtered out on the client-side and marked as discarded.
     */
    discarded: boolean

    /**
     * POC-NEP: Flag to indicate if this was an edit suggestion rather than an inline completion.
     * This is used by the Next Edit Prediction feature for telemetry and to improve future suggestions.
     */
    isEdit?: boolean
}

export interface LogInlineCompletionSessionResultsParams {
    /**
     * Session Id attached to get completion items response.
     * This value must match to the one that server returned in InlineCompletionListWithReferences response.
     */
    sessionId: string
    /**
     * Map with results of interaction with completion items in the client UI.
     * This list contain a state of each recommendation items from the recommendation session.
     */
    completionSessionResult: {
        [itemId: string /* Completion itemId */]: InlineCompletionStates
    }
    /**
     * Time from completion request invocation start to rendering of the first recommendation in the UI.
     */
    firstCompletionDisplayLatency?: number
    /**
     * Total time when items from this completion session were visible in UI
     */
    totalSessionDisplayTime?: number
    /**
     * Length of additional characters inputed by user from when the trigger happens to when the user decision was made
     */
    typeaheadLength?: number
}
