import {
    InsertToCursorPositionParams,
    ChatOptions,
    CodeSelectionType,
    ReferenceTrackerInformation,
    OPEN_TAB_REQUEST_METHOD,
    OpenTabResult,
    GET_SERIALIZED_CHAT_REQUEST_METHOD,
    GetSerializedChatResult,
    ChatPrompt,
} from '@aws/language-server-runtimes-types'
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
export const COPY_TO_CLIPBOARD = 'copyToClipboard'
export const AUTH_FOLLOW_UP_CLICKED = 'authFollowUpClicked'
export const GENERIC_COMMAND = 'genericCommand'
export const CHAT_OPTIONS = 'chatOptions'
export const DISCLAIMER_ACKNOWLEDGED = 'disclaimerAcknowledged'
export const CHAT_PROMPT_OPTION_ACKNOWLEDGED = 'chatPromptOptionAcknowledged'
export const STOP_CHAT_RESPONSE = 'stopChatResponse'
export const OPEN_SETTINGS = 'openSettings'

/**
 * A message sent from Chat Client to Extension in response to various actions triggered from Chat UI.
 */
export interface UiMessage {
    command: UiMessageCommand
    params?: UiMessageParams
}

export type UiMessageCommand =
    | typeof SEND_TO_PROMPT
    | typeof ERROR_MESSAGE
    | typeof INSERT_TO_CURSOR_POSITION
    | typeof AUTH_FOLLOW_UP_CLICKED
    | typeof GENERIC_COMMAND
    | typeof CHAT_OPTIONS
    | typeof COPY_TO_CLIPBOARD
    | typeof DISCLAIMER_ACKNOWLEDGED
    | typeof CHAT_PROMPT_OPTION_ACKNOWLEDGED
    | typeof STOP_CHAT_RESPONSE
    | typeof OPEN_SETTINGS

export type UiMessageParams =
    | InsertToCursorPositionParams
    | AuthFollowUpClickedParams
    | GenericCommandParams
    | ErrorParams
    | SendToPromptParams
    | ChatOptions
    | CopyCodeToClipboardParams
    | ChatPromptOptionAcknowledgedParams
    | StopChatResponseParams
    | OpenSettingsParams

export interface SendToPromptParams {
    selection: string
    triggerType: TriggerType
    prompt?: ChatPrompt
    autoSubmit?: boolean
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

export interface ChatPromptOptionAcknowledgedParams {
    messageId: string
}

export interface ChatPromptOptionAcknowledgedMessage {
    command: typeof CHAT_PROMPT_OPTION_ACKNOWLEDGED
    params: ChatPromptOptionAcknowledgedParams
}

export interface StopChatResponseParams {
    tabId: string
}

export interface StopChatResponseMessage {
    command: typeof STOP_CHAT_RESPONSE
    params: StopChatResponseParams
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

export interface ChatOptionsMessage {
    command: typeof CHAT_OPTIONS
    params: ChatOptions
}

export interface CopyCodeToClipboardParams {
    tabId: string
    messageId: string
    code?: string
    type?: CodeSelectionType
    referenceTrackerInformation?: ReferenceTrackerInformation[]
    eventId?: string
    codeBlockIndex?: number
    totalCodeBlocks?: number
}

export interface CopyCodeToClipboardMessage {
    command: typeof COPY_TO_CLIPBOARD
    params: CopyCodeToClipboardParams
}

export interface OpenSettingsParams {
    settingKey: string
}

/**
 * A message sent from Chat Client to Extension in response to request triggered from Extension.
 * As Chat Client uses PostMessage API for transport with integrating Extensions, this is a loose implementation of request-response model.
 * Responses order is not guaranteed.
 */
export interface UiResultMessage {
    command: UiMessageResultCommand
    params: UiMessageResultParams
}

export type UiMessageResultCommand = typeof OPEN_TAB_REQUEST_METHOD | typeof GET_SERIALIZED_CHAT_REQUEST_METHOD

export type UiMessageResult = OpenTabResult | GetSerializedChatResult

export type UiMessageResultParams =
    | {
          success: true
          result: UiMessageResult
      }
    | {
          success: false
          error: ErrorResult
      }
export interface ErrorResult {
    message: string
    type: string
}

/*
 * A message injected into the client to dynamically add new features, namely the UI.
 */
export interface FeatureValue {
    boolValue?: boolean
    doubleValue?: number
    longValue?: number
    stringValue?: string
}

export interface FeatureContext {
    name?: string
    variation: string
    value: FeatureValue
}
