import { InsertToCursorPositionParams } from '@aws/language-server-runtimes-types'
export { InsertToCursorPositionParams } from '@aws/language-server-runtimes-types'

export type AuthFollowUpType = 'full-auth' | 're-auth' | 'missing_scopes' | 'use-supported-auth'
export function isValidAuthFollowUpType(value: string): value is AuthFollowUpType {
    return ['full-auth', 're-auth', 'missing_scopes', 'use-supported-auth'].includes(value)
}

export type GenericCommandVerb = 'Explain' | 'Refactor' | 'Fix' | 'Optimize'
export type TriggerType = 'hotkeys' | 'click' | 'contextMenu'

export const SEND_TO_PROMPT = 'sendToPrompt'
export const ERROR_MESSAGE = 'errorMessage'
export const INSERT_TO_CURSOR_POSITION = 'insertToCursorPosition'
export const AUTH_FOLLOW_UP_CLICKED = 'authFollowUpClicked'
export const GENERIC_COMMAND = 'genericCommand'

export type UiMessageCommand =
    | typeof SEND_TO_PROMPT
    | typeof ERROR_MESSAGE
    | typeof INSERT_TO_CURSOR_POSITION
    | typeof AUTH_FOLLOW_UP_CLICKED
    | typeof GENERIC_COMMAND

export interface UiMessage {
    command: UiMessageCommand
    params?: UiMessageParams
}

export type UiMessageParams =
    | InsertToCursorPositionParams
    | AuthFollowUpClickedParams
    | GenericCommandParams
    | ErrorParams

export interface SendToPromptParams {
    selection: string
    triggerType: TriggerType
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
    authFollowupType: AuthFollowUpType
}

export interface AuthFollowUpClickedMessage {
    command: typeof AUTH_FOLLOW_UP_CLICKED
    params: AuthFollowUpClickedParams
}

export interface GenericCommandParams {
    tabId: string
    selection: string
    triggerType: TriggerType
    genericCommand: GenericCommandVerb
}

export interface GenericCommandMessage {
    command: typeof GENERIC_COMMAND
    params: GenericCommandParams
}

export interface ErrorParams {
    tabId: string
    triggerType?: TriggerType
    message: string
    title: string
}

export interface ErrorMessage {
    command: typeof ERROR_MESSAGE
    params: ErrorParams
}
