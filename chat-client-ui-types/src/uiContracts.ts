import {
    InsertToCursorPositionParams,
    ChatOptions,
    CodeSelectionType,
    ReferenceTrackerInformation,
    OPEN_TAB_REQUEST_METHOD,
    OpenTabResult,
    GET_SERIALIZED_CHAT_REQUEST_METHOD,
    GetSerializedChatResult,
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
export const EXPORT_CONVERSATION_DIALOG = 'exportConversationDialog'
export const EXPORT_CONVERSATION = 'exportConversation'

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
    | typeof EXPORT_CONVERSATION_DIALOG
    | typeof EXPORT_CONVERSATION

export type UiMessageParams =
    | InsertToCursorPositionParams
    | AuthFollowUpClickedParams
    | GenericCommandParams
    | ErrorParams
    | SendToPromptParams
    | ChatOptions
    | CopyCodeToClipboardParams
    | ExportConversationDialogParams
    | ExportConversationParams

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

/**
 * A notification sent from Chat Client to Extension when "Export Chat" action tiggered in chat client UI.
 * Extension should show a dialog to let user choose the format and select path to export the chat conversation.
 *
 * After user selects destination file, Extension should send `ExportConversationMessage` to Chat Client to receive serialized conversation content.
 */
export interface ExportConversationDialogMessage {
    command: typeof EXPORT_CONVERSATION_DIALOG
    params: ExportConversationDialogParams
}

export interface ExportConversationDialogParams {
    tabId: string
    supportedFormats: ['markdown', 'html']
    defaultFileName: string
}

/**
 * A notification sent from Extension to Chat Client to export serialized conversation history for specific chat tab.
 * `ExportConversationMessage` can be sent as result of `ExportConversationDialogMessage` handler,
 * after user selected a destination for saving conversation.
 */
export interface ExportConversationMessage {
    command: typeof EXPORT_CONVERSATION
    params: ExportConversationParams
}

export interface ExportConversationParams {
    tabId: string
    filepath: string
}

/**
 * A notification sent from Chat Client to Extension to export serialized conversation history to given filepath.
 * Chat Client sends serialized chat conversation messages in selected format.
 */
export interface ExportSerializedConversationMessage {
    command: typeof EXPORT_CONVERSATION
    params: ExportSerializedConversationParams
}
export interface ExportSerializedConversationParams {
    tabId: string
    filepath: string
    format: 'markdown' | 'html'
    serializedChat: string
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
    type: 'InvalidRequest' | 'InternalError' | 'UnknownError' | string
}
