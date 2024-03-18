import { ProgressToken, ProtocolRequestType } from 'vscode-languageserver'

// Chat Data Model
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

export enum VoteType {
    UP = 'upvote',
    DOWN = 'downvote',
}

export interface FeedbackPayload {
    messageId: string
    tabId: string
    selectedOption: string
    comment?: string
}

export type CodeSelectionType = 'selection' | 'block'

// LSP Types
export interface ChatParams {
    tabId: string
    prompt: ChatPrompt
    partialResultToken?: ProgressToken
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
export const chatRequestType = new ProtocolRequestType<ChatParams, ChatResult, ChatResult, void, void>(
    'aws/chat/sendChatPrompt'
)

export type EndChatParams = { tabId: string }
export type EndChatResult = boolean
export const endChatRequestType = new ProtocolRequestType<EndChatParams, EndChatResult, never, void, void>(
    'aws/chat/endChat'
)

export interface QuickActionParams {
    tabId: string
    quickAction: string
    prompt?: string
}
export const quickActionRequestType = new ProtocolRequestType<QuickActionParams, ChatResult, ChatResult, void, void>(
    'aws/chat/sendChatQuickAction'
)

// Currently the QuickAction result and ChatResult share the same shape
export interface QuickActionResult extends ChatResult {}

export interface VoteParams {
    tabId: string
    messageId: string
    vote: VoteType
}

export interface FeedbackParams {
    tabId: string
    messageId: string
    feedbackPayload: FeedbackPayload
}

export interface TabEventParams {
    tabId: string
}

export interface InsertToCursorPositionParams {
    tabId: string
    messageId: string
    code?: string
    type?: CodeSelectionType
    referenceTrackerInformation?: ReferenceTrackerInformation[]
}

// Currently CopyCodeToClipboardParams and InsertToCursorPositionParams have the same shape
// Exporting the two interfaces separately makes future interface changes easier
export interface CopyCodeToClipboardParams extends InsertToCursorPositionParams {}

export interface LinkClickParams {
    tabId: string
    messageId: string
    link: string
    mouseEvent?: MouseEvent
}
export interface InfoLinkClickParams extends LinkClickParams {}
export interface SourceLinkClickParams extends LinkClickParams {}
