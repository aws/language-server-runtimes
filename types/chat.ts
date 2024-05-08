// Chat Data Model
import { Position, Range, TextDocumentIdentifier } from './lsp'

export interface ChatItemAction {
    pillText: string
    prompt?: string
    disabled?: boolean
    description?: string
}

export interface SourceLink {
    title: string
    url: string
    body?: string
}

export interface ReferenceTrackerInformation {
    licenseName?: string
    repository?: string
    url?: string
    recommendationContentSpan?: {
        start?: number
        end?: number
    }
    information: string
}

export interface ChatPrompt {
    prompt?: string
    escapedPrompt?: string
    command?: string
}

export interface FeedbackPayload {
    messageId: string
    tabId: string
    selectedOption: string
    comment?: string
}

export type CodeSelectionType = 'selection' | 'block'

export type CursorState = { position: Position } | { range: Range }

// LSP Types
interface PartialResultParams {
    partialResultToken?: number | string
}

export interface ChatParams extends PartialResultParams {
    tabId: string
    prompt: ChatPrompt
    cursorState?: CursorState[]
    textDocument?: TextDocumentIdentifier
}
export interface ChatResult {
    body?: string
    messageId?: string
    canBeVoted?: boolean // requires messageId to be filled to show vote thumbs
    relatedContent?: {
        title?: string
        content: SourceLink[]
    }
    followUp?: {
        text?: string
        options?: ChatItemAction[]
    }
    codeReference?: ReferenceTrackerInformation[]
}

export type EndChatParams = { tabId: string }
export type EndChatResult = boolean

export interface QuickActionParams extends PartialResultParams {
    tabId: string
    quickAction: string
    prompt?: string
    cursorState?: CursorState[]
    textDocument?: TextDocumentIdentifier
}

// Currently the QuickAction result and ChatResult share the same shape
export interface QuickActionResult extends ChatResult {}

export interface FeedbackParams {
    tabId: string
    messageId: string
    feedbackPayload: FeedbackPayload
}

export interface TabEventParams {
    tabId: string
}

export interface TabAddParams extends TabEventParams {}

export interface TabChangeParams extends TabEventParams {}

export interface TabRemoveParams extends TabEventParams {}

export interface InsertToCursorPositionParams {
    tabId: string
    messageId: string
    code?: string
    type?: CodeSelectionType
    referenceTrackerInformation?: ReferenceTrackerInformation[]
    eventId?: string
    codeBlockIndex?: number
    totalCodeBlocks?: number
}

export interface LinkClickParams {
    tabId: string
    messageId: string
    link: string
    mouseEvent?: MouseEvent
}
export interface InfoLinkClickParams extends LinkClickParams {}

export interface SourceLinkClickParams extends LinkClickParams {}

export interface FollowUpClickParams {
    tabId: string
    messageId: string
    followUp: ChatItemAction
}
