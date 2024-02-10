import { NotificationType, ProgressToken, ProtocolRequestType } from 'vscode-languageserver'

import { ChatItemAction, ChatPrompt, ReferenceTrackerInformation, SourceLink, VoteType } from './constants'

export interface ChatParams {
    tabId: string
    prompt: ChatPrompt
    token?: ProgressToken
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
    token?: ProgressToken
}
export const chatRequestType = new ProtocolRequestType<ChatParams, ChatResult, ChatResult, void, void>(
    'aws/sendChatPrompt'
)

export const chatProgressNotificationType = new NotificationType<ChatResult>('$/progress')

export type EndChatParams = { tabId: string }
export type EndChatResult = boolean
export const endChatRequestType = new ProtocolRequestType<EndChatParams, EndChatResult, never, void, void>(
    'aws/endChat'
)

export interface QuickActionParams {
    tabId: string
    quickAction: string
    prompt?: string
}
export const quickActionRequestType = new ProtocolRequestType<QuickActionParams, ChatResult, ChatResult, void, void>(
    'aws/sendChatQuickAction'
)

export interface VoteParams {
    tabId: string
    messageId: string
    vote: VoteType
}

export interface TabEventParams {
    tabId: string
}
