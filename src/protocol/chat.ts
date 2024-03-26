import { ProgressToken, ProtocolNotificationType, ProtocolRequestType } from './lsp'

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

export const readyNotificationType = new ProtocolNotificationType<void, void>('aws/chat/ready')
// Currently the QuickAction result and ChatResult share the same shape
export interface QuickActionResult extends ChatResult {}

export interface VoteParams {
    tabId: string
    messageId: string
    vote: VoteType
}
export const voteNotificationType = new ProtocolNotificationType<VoteParams, void>('aws/chat/vote')

export interface FeedbackParams {
    tabId: string
    messageId: string
    feedbackPayload: FeedbackPayload
}
export const feedbackNotificationType = new ProtocolNotificationType<FeedbackParams, void>('aws/chat/feedback')

export interface TabEventParams {
    tabId: string
}

export interface TabAddParams extends TabEventParams {}
export const tabAddNotificationType = new ProtocolNotificationType<TabAddParams, void>('aws/chat/tabAdd')

export interface TabChangeParams extends TabEventParams {}
export const tabChangeNotificationType = new ProtocolNotificationType<TabChangeParams, void>('aws/chat/tabChange')

export interface TabRemoveParams extends TabEventParams {}
export const tabRemoveNotificationType = new ProtocolNotificationType<TabRemoveParams, void>('aws/chat/tabRemove')

export interface InsertToCursorPositionParams {
    tabId: string
    messageId: string
    code?: string
    type?: CodeSelectionType
    referenceTrackerInformation?: ReferenceTrackerInformation[]
}
export const insertToCursorPositionNotificationType = new ProtocolNotificationType<InsertToCursorPositionParams, void>(
    'aws/chat/insertToCursorPosition'
)

// Currently CopyCodeToClipboardParams and InsertToCursorPositionParams have the same shape
// Exporting the two interfaces separately makes future interface changes easier
export interface CopyCodeToClipboardParams extends InsertToCursorPositionParams {}
export const copyCodeToClipboardNotificationType = new ProtocolNotificationType<CopyCodeToClipboardParams, void>(
    'aws/chat/copyCodeToClipboard'
)

export interface LinkClickParams {
    tabId: string
    messageId: string
    link: string
    mouseEvent?: MouseEvent
}
export const linkClickNotificationType = new ProtocolNotificationType<LinkClickParams, void>('aws/chat/linkClick')

export interface InfoLinkClickParams extends LinkClickParams {}
export const infoLinkClickNotificationType = new ProtocolNotificationType<InfoLinkClickParams, void>(
    'aws/chat/infoLinkClick'
)

export interface SourceLinkClickParams extends LinkClickParams {}
export const sourceLinkClickNotificationType = new ProtocolNotificationType<SourceLinkClickParams, void>(
    'aws/chat/sourceLinkClick'
)

export interface FollowUpClickParams {
    tabId: string
    messageId: string
    followUp: ChatItemAction
}
export const followUpClickNotificationType = new ProtocolNotificationType<FollowUpClickParams, void>(
    'aws/chat/followUpClick'
)
