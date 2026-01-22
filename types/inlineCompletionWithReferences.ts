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
     * Flag to indicate this is an edit suggestion rather than a standard inline completion.
     */
    isInlineEdit?: boolean

    /**
     * Specifies where the next edit suggestion should appear for tab-tab-tab workflow navigation.
     */
    displayLocation?: {
        range: {
            start: { line: number; character: number }
            end: { line: number; character: number }
        }
        label: string
    }

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

    devSettings?: any
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
}

export interface IdeDiagnostic {
    /**
     * The range at which the message applies.
     */
    range?: {
        start: { line: number; character: number }
        end: { line: number; character: number }
    }
    /**
     * A human-readable string describing the source of the diagnostic
     */
    source?: string
    /**
     * Diagnostic Error type
     */
    severity?: string
    /**
     * Type of the diagnostic
     */
    ideDiagnosticType: string
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
    /**
     * The number of new characters of code that will be added by the suggestion if accepted, excluding any characters
     * from the beginning of the suggestion that the user had typed in after the trigger.
     */
    addedCharacterCount?: number
    /**
     * The number of characters of existing code that will be removed by the suggestion if accepted.
     */
    deletedCharacterCount?: number
    /**
     * Flag to indicate this is an edit suggestion rather than a standard inline completion.
     */
    isInlineEdit?: boolean
    /**
     * List of diagnostic added after inline completion completion acceptence.
     */
    addedDiagnostics?: IdeDiagnostic[]
    /**
     * List of diagnostic removed after inline completion completion acceptence.
     */
    removedDiagnostics?: IdeDiagnostic[]
    /**
     * Generic logging reason
     */
    reason?: string
}
