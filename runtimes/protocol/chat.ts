import {
    ProtocolNotificationType,
    ProtocolRequestType,
    CHAT_REQUEST_METHOD,
    END_CHAT_REQUEST_METHOD,
    FEEDBACK_NOTIFICATION_METHOD,
    FOLLOW_UP_CLICK_NOTIFICATION_METHOD,
    INFO_LINK_CLICK_NOTIFICATION_METHOD,
    INSERT_TO_CURSOR_POSITION_NOTIFICATION_METHOD,
    LINK_CLICK_NOTIFICATION_METHOD,
    QUICK_ACTION_REQUEST_METHOD,
    READY_NOTIFICATION_METHOD,
    SOURCE_LINK_CLICK_NOTIFICATION_METHOD,
    TAB_ADD_NOTIFICATION_METHOD,
    TAB_CHANGE_NOTIFICATION_METHOD,
    TAB_REMOVE_NOTIFICATION_METHOD,
    AutoParameterStructuresProtocolRequestType,
    OPEN_TAB_REQUEST_METHOD,
    CHAT_UPDATE_NOTIFICATION_METHOD,
    FILE_CLICK_NOTIFICATION_METHOD,
    INLINE_CHAT_REQUEST_METHOD,
    CONTEXT_COMMAND_NOTIFICATION_METHOD,
    CREATE_PROMPT_NOTIFICATION_METHOD,
    INLINE_CHAT_RESULT_NOTIFICATION_METHOD,
    PINNED_CONTEXT_NOTIFICATION_METHOD,
    LIST_CONVERSATIONS_REQUEST_METHOD,
    CONVERSATION_CLICK_REQUEST_METHOD,
    GET_SERIALIZED_CHAT_REQUEST_METHOD,
    TAB_BAR_ACTION_REQUEST_METHOD,
    CHAT_OPTIONS_UPDATE_NOTIFICATION_METHOD,
    PROMPT_INPUT_OPTION_CHANGE_METHOD,
    BUTTON_CLICK_REQUEST_METHOD,
    LIST_MCP_SERVERS_REQUEST_METHOD,
    MCP_SERVER_CLICK_REQUEST_METHOD,
    RULE_CLICK_REQUEST_METHOD,
    LIST_RULES_REQUEST_METHOD,
    PINNED_CONTEXT_ADD_NOTIFICATION_METHOD,
    PINNED_CONTEXT_REMOVE_NOTIFICATION_METHOD,
    ACTIVE_EDITOR_CHANGED_NOTIFICATION_METHOD,
    OPEN_FILE_DIALOG_METHOD,
    ChatParams,
    ChatResult,
    EndChatParams,
    EndChatResult,
    FeedbackParams,
    FollowUpClickParams,
    InfoLinkClickParams,
    InsertToCursorPositionParams,
    LinkClickParams,
    QuickActionParams,
    SourceLinkClickParams,
    TabAddParams,
    TabChangeParams,
    TabRemoveParams,
    EncryptedChatParams,
    EncryptedQuickActionParams,
    QuickActionResult,
    OpenTabParams,
    OpenTabResult,
    ChatUpdateParams,
    FileClickParams,
    InlineChatParams,
    InlineChatResult,
    ContextCommandParams,
    CreatePromptParams,
    InlineChatResultParams,
    ListConversationsParams,
    ListConversationsResult,
    ConversationClickParams,
    ConversationClickResult,
    GetSerializedChatParams,
    GetSerializedChatResult,
    TabBarActionParams,
    TabBarActionResult,
    ChatOptionsUpdateParams,
    PromptInputOptionChangeParams,
    ButtonClickParams,
    ButtonClickResult,
    ListMcpServersParams,
    ListMcpServersResult,
    ListRulesResult,
    RuleClickResult,
    PinnedContextParams,
    McpServerClickParams,
    McpServerClickResult,
    ListRulesParams,
    RuleClickParams,
    ActiveEditorChangedParams,
    OpenFileDialogParams,
    OpenFileDialogResult,
    LIST_AVAILABLE_MODELS_REQUEST_METHOD,
    ListAvailableModelsResult,
    ListAvailableModelsParams,
    SUBSCRIPTION_DETAILS_NOTIFICATION_METHOD,
    SubscriptionDetailsParams,
    SUBSCRIPTION_UPGRADE_NOTIFICATION_METHOD,
    SubscriptionUpgradeParams,
} from './lsp'

export const chatRequestType = new AutoParameterStructuresProtocolRequestType<
    ChatParams | EncryptedChatParams,
    ChatResult | string,
    ChatResult | string,
    void,
    void
>(CHAT_REQUEST_METHOD)
export const openFileDialogRequestType = new AutoParameterStructuresProtocolRequestType<
    OpenFileDialogParams,
    OpenFileDialogResult,
    OpenFileDialogResult,
    void,
    void
>(OPEN_FILE_DIALOG_METHOD)
export const inlineChatRequestType = new AutoParameterStructuresProtocolRequestType<
    InlineChatParams | EncryptedChatParams,
    InlineChatResult | string,
    InlineChatResult | string,
    void,
    void
>(INLINE_CHAT_REQUEST_METHOD)
export const endChatRequestType = new ProtocolRequestType<EndChatParams, EndChatResult, never, void, void>(
    END_CHAT_REQUEST_METHOD
)
export const quickActionRequestType = new AutoParameterStructuresProtocolRequestType<
    QuickActionParams | EncryptedQuickActionParams,
    QuickActionResult | string,
    QuickActionResult | string,
    void,
    void
>(QUICK_ACTION_REQUEST_METHOD)
export const readyNotificationType = new ProtocolNotificationType<void, void>(READY_NOTIFICATION_METHOD)
export const feedbackNotificationType = new ProtocolNotificationType<FeedbackParams, void>(FEEDBACK_NOTIFICATION_METHOD)
export const tabAddNotificationType = new ProtocolNotificationType<TabAddParams, void>(TAB_ADD_NOTIFICATION_METHOD)
export const tabChangeNotificationType = new ProtocolNotificationType<TabChangeParams, void>(
    TAB_CHANGE_NOTIFICATION_METHOD
)
export const tabRemoveNotificationType = new ProtocolNotificationType<TabRemoveParams, void>(
    TAB_REMOVE_NOTIFICATION_METHOD
)
export const insertToCursorPositionNotificationType = new ProtocolNotificationType<InsertToCursorPositionParams, void>(
    INSERT_TO_CURSOR_POSITION_NOTIFICATION_METHOD
)
export const linkClickNotificationType = new ProtocolNotificationType<LinkClickParams, void>(
    LINK_CLICK_NOTIFICATION_METHOD
)
export const infoLinkClickNotificationType = new ProtocolNotificationType<InfoLinkClickParams, void>(
    INFO_LINK_CLICK_NOTIFICATION_METHOD
)
export const sourceLinkClickNotificationType = new ProtocolNotificationType<SourceLinkClickParams, void>(
    SOURCE_LINK_CLICK_NOTIFICATION_METHOD
)
export const followUpClickNotificationType = new ProtocolNotificationType<FollowUpClickParams, void>(
    FOLLOW_UP_CLICK_NOTIFICATION_METHOD
)
export const openTabRequestType = new ProtocolRequestType<OpenTabParams, OpenTabResult, never, void, void>(
    OPEN_TAB_REQUEST_METHOD
)
export const buttonClickRequestType = new ProtocolRequestType<ButtonClickParams, ButtonClickResult, never, void, void>(
    BUTTON_CLICK_REQUEST_METHOD
)
export const chatOptionsUpdateType = new ProtocolNotificationType<ChatOptionsUpdateParams, void>(
    CHAT_OPTIONS_UPDATE_NOTIFICATION_METHOD
)
export const chatUpdateNotificationType = new ProtocolNotificationType<ChatUpdateParams, void>(
    CHAT_UPDATE_NOTIFICATION_METHOD
)
export const fileClickNotificationType = new ProtocolNotificationType<FileClickParams, void>(
    FILE_CLICK_NOTIFICATION_METHOD
)

// context
export const contextCommandsNotificationType = new ProtocolNotificationType<ContextCommandParams, void>(
    CONTEXT_COMMAND_NOTIFICATION_METHOD
)
export const createPromptNotificationType = new ProtocolNotificationType<CreatePromptParams, void>(
    CREATE_PROMPT_NOTIFICATION_METHOD
)
/**
 * The inline chat result notification is sent from client to server to notify the action taken by the user
 * from the suggested response returned by the server.
 */
export const inlineChatResultNotificationType = new ProtocolNotificationType<InlineChatResultParams, void>(
    INLINE_CHAT_RESULT_NOTIFICATION_METHOD
)

// pinned context
export const pinnedContextNotificationType = new ProtocolNotificationType<PinnedContextParams, void>(
    PINNED_CONTEXT_NOTIFICATION_METHOD
)
export const onPinnedContextAddNotificationType = new ProtocolNotificationType<PinnedContextParams, void>(
    PINNED_CONTEXT_ADD_NOTIFICATION_METHOD
)
export const onPinnedContextRemoveNotificationType = new ProtocolNotificationType<PinnedContextParams, void>(
    PINNED_CONTEXT_REMOVE_NOTIFICATION_METHOD
)
export const activeEditorChangedNotificationType = new ProtocolNotificationType<ActiveEditorChangedParams, void>(
    ACTIVE_EDITOR_CHANGED_NOTIFICATION_METHOD
)

// rules
export const listRulesRequestType = new AutoParameterStructuresProtocolRequestType<
    ListRulesParams,
    ListRulesResult,
    never,
    void,
    void
>(LIST_RULES_REQUEST_METHOD)

export const ruleClickRequestType = new AutoParameterStructuresProtocolRequestType<
    RuleClickParams,
    RuleClickResult,
    never,
    void,
    void
>(RULE_CLICK_REQUEST_METHOD)
// history
export const listConversationsRequestType = new AutoParameterStructuresProtocolRequestType<
    ListConversationsParams,
    ListConversationsResult,
    never,
    void,
    void
>(LIST_CONVERSATIONS_REQUEST_METHOD)
export const conversationClickRequestType = new AutoParameterStructuresProtocolRequestType<
    ConversationClickParams,
    ConversationClickResult,
    never,
    void,
    void
>(CONVERSATION_CLICK_REQUEST_METHOD)

// mcp servers
export const listMcpServersRequestType = new AutoParameterStructuresProtocolRequestType<
    ListMcpServersParams,
    ListMcpServersResult,
    never,
    void,
    void
>(LIST_MCP_SERVERS_REQUEST_METHOD)

export const mcpServerClickRequestType = new AutoParameterStructuresProtocolRequestType<
    McpServerClickParams,
    McpServerClickResult,
    never,
    void,
    void
>(MCP_SERVER_CLICK_REQUEST_METHOD)

/**
 * The tab bar action request is sent from client to server to execute action from Chat tab bar UI.
 * Tab bar action may have TabId attached to indicate that action is performed on specific tab.
 *
 * See `TabBarActionParams` for supported actions.
 */
export const tabBarActionRequestType = new ProtocolRequestType<
    TabBarActionParams,
    TabBarActionResult,
    never,
    void,
    void
>(TAB_BAR_ACTION_REQUEST_METHOD)

/**
 * The get serialized chat request is sent from server to client to retrieve chat conversation messages serialized to specified format.
 */
export const getSerializedChatRequestType = new ProtocolRequestType<
    GetSerializedChatParams,
    GetSerializedChatResult,
    never,
    void,
    void
>(GET_SERIALIZED_CHAT_REQUEST_METHOD)

export const promptInputOptionChangeNotificationType = new ProtocolNotificationType<
    PromptInputOptionChangeParams,
    void
>(PROMPT_INPUT_OPTION_CHANGE_METHOD)

export const listAvailableModelsRequestType = new ProtocolRequestType<
    ListAvailableModelsParams,
    ListAvailableModelsResult,
    never,
    void,
    void
>(LIST_AVAILABLE_MODELS_REQUEST_METHOD)

// Subscription Tiers

/**
 * Subscription Details Notification is sent from server to client, with the expectation that
 * the client will display the subscription details in the Chat UI.
 */
export const subscriptionDetailsNotificationType = new ProtocolNotificationType<SubscriptionDetailsParams, void>(
    SUBSCRIPTION_DETAILS_NOTIFICATION_METHOD
)

/**
 * Subscription Details Notification is sent from Chat UI through client over to server.
 * Flare will then ask the client to open a URL in the browser.
 */
export const subscriptionUpgradeNotificationType = new ProtocolNotificationType<SubscriptionUpgradeParams, void>(
    SUBSCRIPTION_UPGRADE_NOTIFICATION_METHOD
)
