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
export const BUTTON_CLICK_REQUEST_METHOD = 'aws/chat/buttonClick'
export const CHAT_UPDATE_NOTIFICATION_METHOD = 'aws/chat/sendChatUpdate'
export const FILE_CLICK_NOTIFICATION_METHOD = 'aws/chat/fileClick'
export const INLINE_CHAT_REQUEST_METHOD = 'aws/chat/sendInlineChatPrompt'
export const TAB_BAR_ACTION_REQUEST_METHOD = 'aws/chat/tabBarAction'
export const CHAT_OPTIONS_UPDATE_NOTIFICATION_METHOD = 'aws/chat/chatOptionsUpdate'
export const PROMPT_INPUT_OPTION_CHANGE_METHOD = 'aws/chat/promptInputOptionChange'
// context
export const CONTEXT_COMMAND_NOTIFICATION_METHOD = 'aws/chat/sendContextCommands'
export const CREATE_PROMPT_NOTIFICATION_METHOD = 'aws/chat/createPrompt'
export const INLINE_CHAT_RESULT_NOTIFICATION_METHOD = 'aws/chat/inlineChatResult'
// history
export const LIST_CONVERSATIONS_REQUEST_METHOD = 'aws/chat/listConversations'
export const CONVERSATION_CLICK_REQUEST_METHOD = 'aws/chat/conversationClick'
// export
export const GET_SERIALIZED_CHAT_REQUEST_METHOD = 'aws/chat/getSerializedChat'

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

interface PartialResultParams {
    partialResultToken?: number | string
}

export interface ChatParams extends PartialResultParams {
    tabId: string
    prompt: ChatPrompt
    cursorState?: CursorState[]
    textDocument?: TextDocumentIdentifier
    /**
     * Context of the current chat message to be handled by the servers.
     * Context can be added through QuickActionCommand triggered by `@`.
     */
    context?: QuickActionCommand[]
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
    changes?: {
        added?: number
        deleted?: number
        total?: number
    }
}

export interface FileList {
    rootFolderTitle?: string
    filePaths?: string[]
    deletedFiles?: string[]
    details?: Record<string, FileDetails>
}

export interface Button {
    id: string
    text?: string
    description?: string
    icon?: IconType
    disabled?: boolean
}

export interface ChatMessage {
    type?: 'answer' | 'prompt' | 'system-prompt' | 'directive' | 'tool' // will default to 'answer'
    header?: Omit<ChatMessage, 'header'> & { icon?: IconType }
    buttons?: Button[]
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

/**
 * Represents the result of a chat interaction.
 * A ChatResult extends ChatMessage and can optionally include additional messages
 * that provide context, reasoning, or intermediate steps that led to the final response.
 *
 * Response for chat prompt request can be empty, if server chooses to handle the request and push updates asynchronously.
 */
export interface ChatResult extends ChatMessage {
    /**
     * Optional array of supporting messages that provide additional context for the primary message.
     * These can include:
     * - Reasoning steps that led to the final answer
     * - Tool usage and outputs during processing
     * - Intermediate calculations or decision points
     * - Status updates about the processing
     * - Human interactions that influenced the response
     *
     * The primary message (this ChatResult itself) should contain the final, complete response,
     * while additionalMessages provides transparency into how that response was generated.
     *
     * UI implementations should typically display the primary message prominently,
     * with additionalMessages shown as supporting information when relevant.
     */
    additionalMessages?: ChatMessage[]
}

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

export type ContextCommandIconType = 'file' | 'folder' | 'code-block' | 'list-add' | 'magic'
export type IconType = ContextCommandIconType | 'help' | 'trash' | 'search' | 'calendar' | string

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
    /**
     * Chat QuickActions, supported by Server. Chat Client renders and sets up actions handler for registered QuickAction in UI.
     */
    quickActions?: QuickActions

    /**
     * Server signals to Chat Client support of conversation history.
     */
    history?: boolean

    /**
     * Server signals to Chat Client support of Chat export feature.
     */
    export?: boolean

    /*
        Server signals to Chat Client support of Chat notifications.
        Currently used for sending chat notifications for developer profile updates.
        Can be extended to support other types of notifications.
    */
    chatNotifications?: ChatMessage[]
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

export interface ButtonClickParams {
    tabId: string
    messageId: string
    buttonId: string
}

export interface ButtonClickResult {
    success: boolean
    failureReason?: string
}

export interface TabState {
    inProgress?: boolean
    cancellable?: boolean
}

export interface ChatUpdateParams {
    tabId: string
    state?: TabState
    data?: TabData
}

/**
 * Server-initiated chat metadata updates.
 * Processes changes of developer profiles.
 */
export interface ChatOptionsUpdateParams {
    chatNotifications?: ChatMessage[]
}

export type FileAction = 'accept-change' | 'reject-change'

export interface FileClickParams {
    tabId: string
    filePath: string
    action?: FileAction
    messageId?: string
}

// context

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

export interface ProgrammingLanguage {
    languageName: string
}

export type InlineChatUserDecision = 'ACCEPT' | 'REJECT' | 'DISMISS' | string

export interface InlineChatResultParams {
    requestId: string
    inputLength?: number
    selectedLines?: number
    suggestionAddedChars?: number
    suggestionAddedLines?: number
    suggestionDeletedChars?: number
    suggestionDeletedLines?: number
    codeIntent?: boolean
    userDecision?: InlineChatUserDecision
    responseStartLatency?: number
    responseEndLatency?: number
    programmingLanguage?: ProgrammingLanguage
}

// history
export type TextBasedFilterOption = {
    type: 'textarea' | 'textinput'
    placeholder?: string
    icon?: IconType
}
export type FilterValue = string
export type FilterOption = { id: string } & TextBasedFilterOption
export interface Action {
    id: string
    icon?: IconType
    text: string
}
export interface ConversationItem {
    id: string
    icon?: IconType
    description?: string
    actions?: Action[]
}

export interface ConversationItemGroup {
    groupName?: string
    icon?: IconType
    items?: ConversationItem[]
}

export interface ListConversationsParams {
    // key maps to id in FilterOption and value to corresponding filter value
    filter?: Record<string, FilterValue>
}

export interface ConversationsList {
    header?: { title: string }
    filterOptions?: FilterOption[]
    list: ConversationItemGroup[]
}

export interface ListConversationsResult extends ConversationsList {}

export type ConversationAction = 'delete' | 'export'

export interface ConversationClickParams {
    id: string
    action?: ConversationAction
}

export interface ConversationClickResult extends ConversationClickParams {
    success: boolean
}

export type TabBarAction = 'export'
export interface TabBarActionParams {
    tabId?: string
    action: TabBarAction
}

export interface TabBarActionResult extends TabBarActionParams {
    success: boolean
}

export interface GetSerializedChatParams extends TabEventParams {
    format: 'html' | 'markdown'
}

export interface GetSerializedChatResult {
    content: string
}

export interface PromptInputOptionChangeParams {
    tabId: string
    optionsValues: Record<string, string>
    eventId?: string
}
