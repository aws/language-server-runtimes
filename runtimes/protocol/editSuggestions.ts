/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    ProtocolNotificationType,
    ProtocolRequestType,
    TextDocumentPositionParams,
    WorkDoneProgressParams,
} from './lsp'

export const editSuggestionsRequestType = new ProtocolRequestType<
    EditSuggestionsParams,
    EditSuggestionsResult | null,
    void, // TODO Do we need a progress type?
    void, // TODO Do we need to support custom error results?
    void // TODO Do we need to support dynamic registration?
>('aws/textDocument/editSuggestions')

export const logEditSuggestionsNotificationType = new ProtocolNotificationType<LogEditSuggestionsParams, void>(
    'aws/textDocument/logEditSuggestionsResults'
)

import { Range } from 'vscode-languageserver-types'

/**
 * Represents an edit suggestion from the server.
 */
export interface EditSuggestion {
    /**
     * Unique identifier for this edit suggestion.
     */
    itemId: string

    /**
     * The range in the document where the edit should be applied.
     */
    range: Range

    /**
     * The new text that should replace the content in the range.
     */
    newText: string

    /**
     * Base64 encoded SVG image representing the edit suggestion.
     * This should be a complete SVG image encoded as a base64 string.
     */
    svgImage?: string

    /**
     * Optional references for the suggested edit.
     */
    references?: {
        // TODO Are any of these fields required?
        referenceName?: string
        referenceUrl?: string
        licenseName?: string
    }[]
}

/**
 * Response containing edit suggestions.
 */
export interface EditSuggestionsResult {
    /**
     * Session ID for tracking this set of suggestions.
     */
    sessionId: string

    /**
     * The edit suggestions.
     */
    suggestions: EditSuggestion[]
}

/**
 * Parameters for requesting edit suggestions.
 */
export interface EditSuggestionsParams extends TextDocumentPositionParams, WorkDoneProgressParams {
    /**
     * Recent edit history for the document.
     */
    editHistory?: DocumentEdit[]
}

/**
 * Represents a single edit made to a document.
 */
export interface DocumentEdit {
    /**
     * Timestamp when the edit was made.
     */
    timestamp: number

    /**
     * The range that was modified.
     */
    range: Range

    /**
     * The text that was inserted.
     */
    text: string

    /**
     * The length of the text that was replaced.
     */
    rangeLength: number
}

/**
 * States for an edit suggestion.
 */
export interface EditSuggestionStates {
    /**
     * Whether the suggestion was shown to the user.
     */
    seen: boolean

    /**
     * Whether the suggestion was accepted by the user.
     */
    accepted: boolean

    /**
     * Whether the suggestion was rejected by the user.
     */
    rejected: boolean
}

/**
 * Parameters for logging edit suggestion results.
 */
export interface LogEditSuggestionsParams {
    /**
     * Session ID from the edit suggestion response.
     */
    sessionId: string

    /**
     * Results of user interaction with the suggestions.
     */
    suggestionResults: Record<EditSuggestion['itemId'], EditSuggestionStates>

    /**
     * Time from request to first suggestion display.
     */
    displayLatency?: number

    /**
     * Total time suggestions were visible.
     */
    totalDisplayTime?: number
}
