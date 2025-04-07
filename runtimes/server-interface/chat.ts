import {
    NotificationHandler,
    RequestHandler,
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
    QuickActionResult,
    SourceLinkClickParams,
    TabChangeParams,
    TabAddParams,
    TabRemoveParams,
    OpenTabParams,
    OpenTabResult,
    ChatUpdateParams,
    FileClickParams,
    InlineChatParams,
    InlineChatResult,
    ContextCommandParams,
    CreatePromptParams,
    ListConversationsParams,
    ListConversationsResult,
    ConversationClickParams,
    ConversationClickResult,
} from '../protocol'

/**
 * The Chat feature interface. Provides access to chat features
 */
export type Chat = {
    // Requests
    onChatPrompt: (handler: RequestHandler<ChatParams, ChatResult | undefined | null, ChatResult>) => void
    onInlineChatPrompt: (
        handler: RequestHandler<InlineChatParams, InlineChatResult | undefined | null, InlineChatResult>
    ) => void
    onEndChat: (handler: RequestHandler<EndChatParams, EndChatResult, void>) => void
    onQuickAction: (handler: RequestHandler<QuickActionParams, QuickActionResult, void>) => void
    openTab: (params: OpenTabParams) => Promise<OpenTabResult>
    onListConversations: (handler: RequestHandler<ListConversationsParams, ListConversationsResult, void>) => void
    onConversationClick: (handler: RequestHandler<ConversationClickParams, ConversationClickResult, void>) => void
    // Notifications
    onSendFeedback: (handler: NotificationHandler<FeedbackParams>) => void
    onReady: (handler: NotificationHandler<void>) => void
    onTabAdd: (handler: NotificationHandler<TabAddParams>) => void
    onTabChange: (handler: NotificationHandler<TabChangeParams>) => void
    onTabRemove: (handler: NotificationHandler<TabRemoveParams>) => void
    onCodeInsertToCursorPosition: (handler: NotificationHandler<InsertToCursorPositionParams>) => void
    onLinkClick: (handler: NotificationHandler<LinkClickParams>) => void
    onInfoLinkClick: (handler: NotificationHandler<InfoLinkClickParams>) => void
    onSourceLinkClick: (handler: NotificationHandler<SourceLinkClickParams>) => void
    onFollowUpClicked: (handler: NotificationHandler<FollowUpClickParams>) => void
    sendChatUpdate: (params: ChatUpdateParams) => void
    onFileClicked: (handler: NotificationHandler<FileClickParams>) => void
    sendContextCommands: (params: ContextCommandParams) => void
    onCreatePrompt: (handler: NotificationHandler<CreatePromptParams>) => void
}
