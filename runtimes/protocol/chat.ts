import {
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
    EncryptedChatParams,
    EncryptedQuickActionParams,
    QuickActionResult,
} from './lsp'

export const chatRequestType = new AutoParameterStructuresProtocolRequestType<
    ChatParams | EncryptedChatParams,
    ChatResult | string,
    ChatResult | string,
    void,
    void
>(CHAT_REQUEST_METHOD)
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
