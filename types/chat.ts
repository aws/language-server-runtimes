import { Position, Range, TextDocumentIdentifier } from './lsp'

// protocol methods
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
export const OPEN_FILE_DIALOG_METHOD = 'aws/chat/openFileDialog'
export const EXECUTE_SHELL_COMMAND_SHORTCUT_METHOD = 'aws/chat/executeShellCommandShortCut'

// context
export const CONTEXT_COMMAND_NOTIFICATION_METHOD = 'aws/chat/sendContextCommands'
export const CREATE_PROMPT_NOTIFICATION_METHOD = 'aws/chat/createPrompt'
export const INLINE_CHAT_RESULT_NOTIFICATION_METHOD = 'aws/chat/inlineChatResult'

// pinned context
export const PINNED_CONTEXT_ADD_NOTIFICATION_METHOD = 'aws/chat/pinnedContextAdd'
export const PINNED_CONTEXT_REMOVE_NOTIFICATION_METHOD = 'aws/chat/pinnedContextRemove'
export const RULE_CLICK_REQUEST_METHOD = 'aws/chat/ruleClick'

export const PINNED_CONTEXT_NOTIFICATION_METHOD = 'aws/chat/sendPinnedContext'
export const LIST_RULES_REQUEST_METHOD = 'aws/chat/listRules'

//active tab
export const ACTIVE_EDITOR_CHANGED_NOTIFICATION_METHOD = 'aws/chat/activeEditorChanged'

// history
export const LIST_CONVERSATIONS_REQUEST_METHOD = 'aws/chat/listConversations'
export const CONVERSATION_CLICK_REQUEST_METHOD = 'aws/chat/conversationClick'
//mcpServers
export const LIST_MCP_SERVERS_REQUEST_METHOD = 'aws/chat/listMcpServers'
export const MCP_SERVER_CLICK_REQUEST_METHOD = 'aws/chat/mcpServerClick'
// export
export const GET_SERIALIZED_CHAT_REQUEST_METHOD = 'aws/chat/getSerializedChat'

// model selection
export const LIST_AVAILABLE_MODELS_REQUEST_METHOD = 'aws/chat/listAvailableModels'

// button ids
export const OPEN_WORKSPACE_INDEX_SETTINGS_BUTTON_ID = 'open-settings-for-ws-index'

// Subscription Tiers
export const SUBSCRIPTION_DETAILS_NOTIFICATION_METHOD = 'aws/chat/subscription/details'
export const SUBSCRIPTION_UPGRADE_NOTIFICATION_METHOD = 'aws/chat/subscription/upgrade'
export const SUBSCRIPTION_SHOW_COMMAND_METHOD = 'aws/chat/subscription/show'

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
    fullPath?: string
    lineRanges?: Array<{ first: number; second: number }>
    changes?: {
        added?: number
        deleted?: number
        total?: number
    }
    visibleName?: string
}

export interface FileList {
    rootFolderTitle?: string
    filePaths?: string[]
    deletedFiles?: string[]
    details?: Record<string, FileDetails>
}

export type Status = 'info' | 'success' | 'warning' | 'error'
export interface Button {
    id: string
    text?: string
    description?: string
    icon?: IconType
    disabled?: boolean
    keepCardAfterClick?: boolean
    status?: 'main' | 'primary' | 'clear' | Status
}

export interface ChatMessage {
    type?: 'answer' | 'prompt' | 'system-prompt' | 'directive' | 'tool' // will default to 'answer'
    header?: Omit<ChatMessage, 'header'> & {
        icon?: IconType
        status?: { status?: Status; icon?: IconType; text?: string }
    }
    buttons?: Button[]
    body?: string
    messageId?: string
    canBeVoted?: boolean // requires messageId to be filled to show vote thumbs
    relatedContent?: {
        title?: string
        content: SourceLink[]
    }
    summary?: {
        content?: ChatMessage
        collapsedContent?: ChatMessage[]
    }
    followUp?: {
        text?: string
        options?: ChatItemAction[]
    }
    codeReference?: ReferenceTrackerInformation[]
    fileList?: FileList
    contextList?: FileList
    quickSettings?: {
        type: 'select' | 'checkbox' | 'radio'
        description?: string
        descriptionLink?: {
            id: string
            text: string
            destination: string
        }
        messageId: string
        tabId: string
        options: {
            id: string
            label: string
            value: string
            selected?: boolean | undefined
        }[]
    }
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

    mcpServers?: boolean

    /**
     * Server signals to Chat Client support of model selection.
     */
    modelSelection?: boolean

    /**
     * Server signals to Chat Client support of conversation history.
     */
    history?: boolean

    /**
     * Server signals to Chat Client support of Chat export feature.
     */
    export?: boolean

    /**
     * Server signals to Chat Client support of show logs feature.
     */
    showLogs?: boolean

    /**
     * Server signals to Client and Chat Client that it supports subscription tier operations
     */
    subscriptionDetails?: boolean

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

export interface TabAddParams extends TabEventParams {
    restoredTab?: boolean
}

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
    metadata?: Record<string, string>
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
 */
export interface ChatOptionsUpdateParams {
    tabId: string
    /**
     * Processes changes of developer profiles.
     */
    chatNotifications?: ChatMessage[]
    /**
     * The last selected modelId for the conversation. This is used to allow the server to
     * programmatically update the selected model for persistance across sessions.
     */
    modelId?: string
}

export type FileAction = 'accept-change' | 'reject-change'

export interface FileClickParams {
    tabId: string
    filePath: string
    action?: FileAction
    messageId?: string
    fullPath?: string
}

// context

export interface ContextCommandGroup {
    groupName?: string
    commands: ContextCommand[]
}

export interface ContextCommand extends QuickActionCommand {
    id?: string
    route?: string[]
    label?: 'file' | 'folder' | 'code' | 'image'
    children?: ContextCommandGroup[]
    content?: Uint8Array
}

export interface ContextCommandParams {
    contextCommandGroups: ContextCommandGroup[]
}

export interface PinnedContextParams extends ContextCommandParams {
    tabId: string
    textDocument?: TextDocumentIdentifier
    showRules?: boolean
}

export interface CreatePromptParams {
    promptName: string
    isRule?: boolean
}

export interface OpenFileDialogParams {
    tabId: string
    fileType: 'image' | ''
    insertPosition?: number
}

export interface OpenFileDialogResult {
    tabId: string
    fileType: 'image' | ''
    filePaths: string[]
    errorMessage?: string
    insertPosition?: number
}

export interface DropFilesParams {
    tabId: string
    files: FileList
    insertPosition: number
    errorMessage?: string
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
export interface FilterOptionBase {
    placeholder?: string
    title?: string
    description?: string
    icon?: IconType
}

export type TextBasedFilterOption = FilterOptionBase & {
    type: 'textarea' | 'textinput' | 'numericinput'
}

export type OptionBasedFilterOption = FilterOptionBase & {
    type: 'select' | 'radiogroup'
    options: Array<{
        value: string
        label: string
    }>
}

export type BaseFilterOption = TextBasedFilterOption | OptionBasedFilterOption
export type FilterValue = string
export type FilterOption = { id: string } & BaseFilterOption
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

export interface ListMcpServersParams {
    filter?: Record<string, FilterValue>
}

export interface ListRulesParams {
    tabId: string
}

export interface ListRulesResult {
    tabId: string
    header?: { title: string }
    filterOptions?: FilterOption[]
    rules: RulesFolder[]
}

export interface RulesFolder {
    folderName?: string
    /**
     * Represents the active state of the folder:
     * - true: all rules in the folder are active
     * - false: all rules in the folder are inactive
     * - 'indeterminate': rules inside the folder have mixed active states (some active, some inactive),
     *   similar to a parent checkbox in a nested checkbox list having an indeterminate state
     */
    active: boolean | 'indeterminate'
    rules: Rule[]
}

export interface Rule {
    active: boolean
    name: string
    id: string
}

export interface RuleClickParams {
    tabId: string
    type: 'folder' | 'rule'
    id: string
}

export interface RuleClickResult extends RuleClickParams {
    success: boolean
}

export interface ActiveEditorChangedParams {
    cursorState?: CursorState[]
    textDocument?: TextDocumentIdentifier
}

export interface ConversationsList {
    header?: { title: string }
    filterOptions?: FilterOption[]
    list: ConversationItemGroup[]
}

export interface ListConversationsResult extends ConversationsList {}

export type McpServerStatus = 'INITIALIZING' | 'ENABLED' | 'FAILED' | 'DISABLED'

export interface DetailedListItem {
    title: string
    description?: string
    groupActions?: boolean
    children?: DetailedListGroup[]
}

export interface DetailedListGroup {
    groupName?: string
    children?: DetailedListItem[]
    actions?: Action[]
    icon?: IconType
}

export interface ListMcpServersResult {
    header?: {
        title: string
        description?: string
        status?: {
            icon?: IconType
            title?: string
            status?: Status
        }
    }
    list: DetailedListGroup[]
    filterOptions?: FilterOption[]
}

export type ConversationAction = 'delete' | 'export'

export interface ConversationClickParams {
    id: string
    action?: ConversationAction
}

export interface ConversationClickResult extends ConversationClickParams {
    success: boolean
}

export interface McpServerClickParams {
    id: string
    title?: string
    optionsValues?: Record<string, string>
}

export interface McpServerClickResult extends McpServerClickParams {
    filterOptions?: FilterOption[] | null
    filterActions?: Button[]
    list?: DetailedListGroup[]
    header?: {
        title?: string
        icon?: IconType
        status?: {
            icon?: IconType
            title?: string
            description?: string
            status?: Status
        }
        description?: string
        actions?: Action[]
    }
}

export type TabBarAction = 'export' | 'show_logs'
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

export interface Model {
    id: string
    name: string
}

export interface ListAvailableModelsParams {
    tabId: string
}

export interface ListAvailableModelsResult {
    tabId: string
    models: Model[]
    selectedModelId?: string
}

export interface ExecuteShellCommandParams {
    id: string
}

export interface SubscriptionDetailsParams {
    subscriptionTier: string
    subscriptionPeriodReset: Date
    isOverageEnabled: boolean
    queryUsage: number
    queryLimit: number
    queryOverage: number
}

export interface SubscriptionUpgradeParams {}
