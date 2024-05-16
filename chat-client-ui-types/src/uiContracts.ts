import {
    CodeSelectionType,
    InsertToCursorPositionParams,
    ReferenceTrackerInformation,
} from '@aws/language-server-runtimes-types'
export {
    CodeSelectionType,
    InsertToCursorPositionParams,
    ReferenceTrackerInformation,
} from '@aws/language-server-runtimes-types'

export type AuthFollowUpType = 'full-auth' | 're-auth' | 'missing_scopes' | 'use-supported-auth'
export function isValidAuthFollowUpType(value: string): value is AuthFollowUpType {
    return ['full-auth', 're-auth', 'missing_scopes', 'use-supported-auth'].includes(value)
}

export enum RelevancyVoteType {
    UP = 'upvote',
    DOWN = 'downvote',
}

export type GenericCommandVerb = 'Explain' | 'Refactor' | 'Fix' | 'Optimize'

export const TAB_ID_RECEIVED = 'triggerTabIdReceived'
export const SEND_TO_PROMPT = 'sendToPrompt'
export const ERROR_MESSAGE = 'errorMessage'
export const INSERT_TO_CURSOR_POSITION = 'insertToCursorPosition'
export const AUTH_FOLLOW_UP_CLICKED = 'authFollowUpClicked'
export const GENERIC_COMMAND = 'genericCommand'

export type UiMessageCommand =
    | typeof TAB_ID_RECEIVED
    | typeof SEND_TO_PROMPT
    | typeof ERROR_MESSAGE
    | typeof INSERT_TO_CURSOR_POSITION
    | typeof AUTH_FOLLOW_UP_CLICKED
    | typeof GENERIC_COMMAND

export interface UiMessage {
    command: UiMessageCommand
    params?: UiMessageParams
}

export type UiMessageParams = TabIdReceivedParams | InsertToCursorPositionParams | AuthFollowUpClickedParams

export interface TabIdReceivedParams {
    eventId: string
    tabId: string
}

export interface TabIdReceivedMessage {
    command: typeof TAB_ID_RECEIVED
    params: TabIdReceivedParams
}

export interface SendToPromptParams {
    selection: string
    eventId: string
}

export interface SendToPromptMessage {
    command: typeof SEND_TO_PROMPT
    params: SendToPromptParams
}

export interface InsertToCursorPositionMessage {
    command: typeof INSERT_TO_CURSOR_POSITION
    params: InsertToCursorPositionParams
}

export interface AuthFollowUpClickedParams {
    tabId: string
    messageId: string
    eventId?: string
    authFollowupType: AuthFollowUpType
}

export interface AuthFollowUpClickedMessage {
    command: typeof AUTH_FOLLOW_UP_CLICKED
    params: AuthFollowUpClickedParams
}

export interface CopyCodeToClipboardParams {
    tabId: string
    messageId: string
    code?: string
    type?: CodeSelectionType
    referenceTrackerInformation?: ReferenceTrackerInformation[]
    eventId: string
    codeBlockIndex?: number
    totalCodeBlocks?: number
}

export interface VoteParams {
    tabId: string
    messageId: string
    vote: RelevancyVoteType
    eventId?: string
}

export interface GenericCommandParams {
    tabId: string
    selection: string
    eventId?: string
    genericCommand: GenericCommandVerb
}

export interface GenericCommandMessage {
    command: typeof GENERIC_COMMAND
    params: GenericCommandParams
}

export interface ErrorParams {
    tabId: string
    eventId?: string
    message: string
    title: string
}

export interface ErrorMessage {
    command: typeof ERROR_MESSAGE
    params: ErrorParams
}
