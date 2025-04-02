// Chat Data Model
import { Position, Range, TextDocumentIdentifier } from './lsp'

export const CHAT_REQUEST_METHOD = 'aws/chat/sendChatPrompt'
export const END_CHAT_REQUEST_METHOD = 'aws/chat/endChat'
export const QUICK_ACTION_REQUEST_METHOD = 'aws/chat/sendChatQuickAction'
export const READY_NOTIFICATION_METHOD = 'aws/chat/ready'
export const FEEDBACK_NOTIFICATION_METHOD = 'aws/chat/feedback'
export const TAB_ADD_NOTIFICATION_METHOD = 'aws/chat/tabAdd'
export const TAB_CHANGE_NOTIFICATION_METHOD = 'aws/chat/tabChange'
export const TAB_REMOVE_NOTIFICATION_METHOD = 'aws/chat/tabRemove'
export const INSERT_TO_CURSOR_POSITION_NOTIFICATION_METHOD = 'aws/chat/insertToCursorPosition'
export const LINK_CLICK_NOTIFICATION_METHOD = 'aws/chat/linkClick'
export const INFO_LINK_CLICK_NOTIFICATION_METHOD = 'aws/chat/infoLinkClick'
export const SOURCE_LINK_CLICK_NOTIFICATION_METHOD = 'aws/chat/sourceLinkClick'
export const FOLLOW_UP_CLICK_NOTIFICATION_METHOD = 'aws/chat/followUpClick'
export const OPEN_TAB_REQUEST_METHOD = 'aws/chat/openTab'
export const CHAT_UPDATE_NOTIFICATION_METHOD = 'aws/chat/sendChatUpdate'
export const FILE_CLICK_NOTIFICATION_METHOD = 'aws/chat/fileClick'
export const INLINE_CHAT_REQUEST_METHOD = 'aws/chat/sendInlineChatPrompt'
export const CONTEXT_COMMAND_NOTIFICATION_METHOD = 'aws/chat/sendContextCommands'
export const CREATE_PROMPT_NOTIFICATION_METHOD = 'aws/chat/createPrompt'

export interface ChatItemAction {
    pillText: string
    prompt?: string
    disabled?: boolean
    description?: string
    type?: string
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
        start: number
        end: number
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

export interface InlineChatParams extends PartialResultParams {
    prompt: ChatPrompt
    cursorState?: CursorState[]
    textDocument?: TextDocumentIdentifier
}

export interface EncryptedChatParams extends PartialResultParams {
    message: string
}

export interface FileDetails {
    description?: string
    lineRanges?: Array<{ first: number; second: number }>
}

export interface FileList {
    rootFolderTitle?: string
    filePaths?: string[]
    deletedFiles?: string[]
    details?: Record<string, FileDetails>
}

export interface ChatMessage {
    type?: 'answer' | 'prompt' | 'system-prompt' // will default to 'answer'
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
    fileList?: FileList
    contextList?: FileList
}
// Response for chat prompt request can be empty,
// if server chooses to handle the request and push updates asynchronously.
export interface ChatResult extends ChatMessage {}
export interface InlineChatResult extends ChatMessage {
    requestId?: string
}

export type EndChatParams = { tabId: string }
export type EndChatResult = boolean

/**
 * Configuration object for chat quick action.
 */
export interface QuickActionCommand {
    command: string
    description?: string
    placeholder?: string
    icon?: IconType
}

export type IconType = 'file' | 'folder' | 'code-block' | 'list-add' | 'magic' | 'help' | 'trash'

/**
 * Configuration object for registering chat quick actions groups.
 */
export interface QuickActionCommandGroup {
    groupName?: string
    commands: QuickActionCommand[]
}

/**
 * Registration options for a Chat QuickActionRequest.
 */
export interface QuickActions {
    /**
     * The chat quick actions groups and commands to be executed on server.
     */
    quickActionsCommandGroups: QuickActionCommandGroup[]
}

export interface TabData {
    placeholderText?: string
    messages: ChatMessage[]
}

/**
 * Registration options regarding chat data
 * Currently contains the available quick actions provided by a server
 * and the default tab data to be shown to the user in the chat UI
 */
export interface ChatOptions {
    quickActions?: QuickActions
}

export interface QuickActionParams extends PartialResultParams {
    tabId: string
    quickAction: string
    prompt?: string
    cursorState?: CursorState[]
    textDocument?: TextDocumentIdentifier
}

export interface EncryptedQuickActionParams extends PartialResultParams {
    message: string
}

// Currently the QuickActionResult and ChatResult share the same shape.
// Response for quick actions request can be empty,
// if server chooses to handle the request and push updates asynchronously.
export interface QuickActionResult extends ChatMessage {}

export interface FeedbackParams {
    tabId: string
    feedbackPayload: FeedbackPayload
    eventId?: string
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
    cursorPosition?: Position
    textDocument?: TextDocumentIdentifier
    code?: string
    type?: CodeSelectionType
    referenceTrackerInformation?: ReferenceTrackerInformation[]
    eventId?: string
    codeBlockIndex?: number
    totalCodeBlocks?: number
}

export interface InfoLinkClickParams {
    tabId: string
    link: string
    eventId?: string
}
export interface LinkClickParams extends InfoLinkClickParams {
    messageId: string
}

export interface SourceLinkClickParams extends InfoLinkClickParams {
    messageId: string
}

export interface FollowUpClickParams {
    tabId: string
    messageId: string
    followUp: ChatItemAction
}

/*
    Defines parameters for opening a tab.
    Opens existing tab if `tabId` is provided, otherwise creates a new tab
    with options provided in `options` parameter and opens it.
*/
export interface OpenTabParams extends Partial<TabEventParams> {
    newTabOptions?: {
        state?: TabState
        data?: TabData
    }
}
export interface OpenTabResult extends TabEventParams {}

export interface TabState {
    inProgress?: boolean
    cancellable?: boolean
}

export interface ChatUpdateParams {
    tabId: string
    state?: TabState
    data?: TabData
}

export type FileAction = 'accept-change' | 'reject-change'

export interface FileClickParams {
    tabId: string
    filePath: string
    action?: FileAction
}

export interface ContextCommandGroup {
    groupName?: string
    commands: ContextCommand[]
}

export interface ContextCommand extends QuickActionCommand {
    id?: string
    route?: string[]
    label?: 'file' | 'folder' | 'code'
    children?: ContextCommandGroup[]
}

export interface ContextCommandParams {
    contextCommandGroups: ContextCommandGroup[]
}

export interface CreatePromptParams {
    promptName: string
}
