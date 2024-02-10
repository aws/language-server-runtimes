import { NotificationHandler, RequestHandler } from 'vscode-languageserver'
import {
    ChatParams,
    ChatResult,
    EndChatParams,
    EndChatResult,
    QuickActionParams,
    TabEventParams,
    VoteParams,
} from './types'

/**
 * The Chat feature interface. Provides access to chat features
 */
export type Chat = {
    onChatPrompt: (handler: RequestHandler<ChatParams, ChatResult | undefined | null, void>) => void // send result as partials and then send complete message
    onEndChat: (handler: RequestHandler<EndChatParams, EndChatResult, void>) => void
    onQuickAction: (handler: RequestHandler<QuickActionParams, ChatResult, void>) => void

    // Notifications
    onSendFeedback?: (handler: NotificationHandler<VoteParams>) => void
    onReady?: (handler: NotificationHandler<void>) => void
    onTabAdd?: (handler: NotificationHandler<TabEventParams>) => void
    onTabChange?: (handler: NotificationHandler<TabEventParams>) => void
    onTabRemove?: (handler: NotificationHandler<TabEventParams>) => void
    onVote?: (handler: NotificationHandler<VoteParams>) => void

    // todo
    onChatItemEngagement?: any
    onCodeInsertToCursorPosition?: any
    onCopyCodeToClipboard?: any
    onFollowUpClicked?: any
    onLinkClick?: any
    onInfoLinkClick?: any
    onSourceLinkClick?: any
}
