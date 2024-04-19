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
    SourceLinkClickParams,
    TabAddParams,
    TabChangeParams,
    TabRemoveParams,
    VoteParams,
} from '@aws/language-server-runtimes-types'
import { ProtocolNotificationType, ProtocolRequestType } from './lsp'

export const chatRequestType = new ProtocolRequestType<ChatParams, ChatResult, ChatResult, void, void>(
    'aws/chat/sendChatPrompt'
)

export const endChatRequestType = new ProtocolRequestType<EndChatParams, EndChatResult, never, void, void>(
    'aws/chat/endChat'
)

export const quickActionRequestType = new ProtocolRequestType<QuickActionParams, ChatResult, ChatResult, void, void>(
    'aws/chat/sendChatQuickAction'
)

export const readyNotificationType = new ProtocolNotificationType<void, void>('aws/chat/ready')

export const voteNotificationType = new ProtocolNotificationType<VoteParams, void>('aws/chat/vote')

export const feedbackNotificationType = new ProtocolNotificationType<FeedbackParams, void>('aws/chat/feedback')

export const tabAddNotificationType = new ProtocolNotificationType<TabAddParams, void>('aws/chat/tabAdd')

export const tabChangeNotificationType = new ProtocolNotificationType<TabChangeParams, void>('aws/chat/tabChange')

export const tabRemoveNotificationType = new ProtocolNotificationType<TabRemoveParams, void>('aws/chat/tabRemove')

export const insertToCursorPositionNotificationType = new ProtocolNotificationType<InsertToCursorPositionParams, void>(
    'aws/chat/insertToCursorPosition'
)

export const copyCodeToClipboardNotificationType = new ProtocolNotificationType<CopyCodeToClipboardParams, void>(
    'aws/chat/copyCodeToClipboard'
)

export const linkClickNotificationType = new ProtocolNotificationType<LinkClickParams, void>('aws/chat/linkClick')

export const infoLinkClickNotificationType = new ProtocolNotificationType<InfoLinkClickParams, void>(
    'aws/chat/infoLinkClick'
)

export const sourceLinkClickNotificationType = new ProtocolNotificationType<SourceLinkClickParams, void>(
    'aws/chat/sourceLinkClick'
)

export const followUpClickNotificationType = new ProtocolNotificationType<FollowUpClickParams, void>(
    'aws/chat/followUpClick'
)
