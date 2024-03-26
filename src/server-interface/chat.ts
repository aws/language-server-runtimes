import { NotificationHandler, RequestHandler } from '../protocol'
import {
    ChatParams,
    ChatResult,
    CopyCodeToClipboardParams,
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
    VoteParams,
} from '../protocol'

/**
 * The Chat feature interface. Provides access to chat features
 */
export type Chat = {
    // Requests
    onChatPrompt: (handler: RequestHandler<ChatParams, ChatResult | undefined | null, ChatResult>) => void
    onEndChat: (handler: RequestHandler<EndChatParams, EndChatResult, void>) => void
    onQuickAction: (handler: RequestHandler<QuickActionParams, QuickActionResult, void>) => void
    // Notifications
    onSendFeedback: (handler: NotificationHandler<FeedbackParams>) => void
    onReady: (handler: NotificationHandler<void>) => void
    onTabAdd: (handler: NotificationHandler<TabAddParams>) => void
    onTabChange: (handler: NotificationHandler<TabChangeParams>) => void
    onTabRemove: (handler: NotificationHandler<TabRemoveParams>) => void
    onVote: (handler: NotificationHandler<VoteParams>) => void
    onCodeInsertToCursorPosition: (handler: NotificationHandler<InsertToCursorPositionParams>) => void
    onCopyCodeToClipboard: (handler: NotificationHandler<CopyCodeToClipboardParams>) => void
    onLinkClick: (handler: NotificationHandler<LinkClickParams>) => void
    onInfoLinkClick: (handler: NotificationHandler<InfoLinkClickParams>) => void
    onSourceLinkClick: (handler: NotificationHandler<SourceLinkClickParams>) => void
    onFollowUpClicked: (handler: NotificationHandler<FollowUpClickParams>) => void
}
