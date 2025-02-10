import { Connection } from 'vscode-languageserver'
import {
    ChatParams,
    ChatResult,
    EndChatParams,
    FeedbackParams,
    FollowUpClickParams,
    InfoLinkClickParams,
    InsertToCursorPositionParams,
    LinkClickParams,
    NotificationHandler,
    QuickActionParams,
    QuickActionResult,
    RequestHandler,
    SourceLinkClickParams,
    TabAddParams,
    TabChangeParams,
    TabRemoveParams,
    chatRequestType,
    feedbackNotificationType,
    readyNotificationType,
    tabAddNotificationType,
    tabChangeNotificationType,
    tabRemoveNotificationType,
    insertToCursorPositionNotificationType,
    linkClickNotificationType,
    infoLinkClickNotificationType,
    sourceLinkClickNotificationType,
    followUpClickNotificationType,
    endChatRequestType,
    quickActionRequestType,
    SendUpdateParams,
    sendUpdateNotificationType,
    FileClickParams,
    fileClickNotificationType,
} from '../../protocol'
import { Chat } from '../../server-interface'

export class BaseChat implements Chat {
    constructor(protected readonly connection: Connection) {}

    public onChatPrompt(handler: RequestHandler<ChatParams, ChatResult | null | undefined, ChatResult>) {
        this.connection.onRequest(chatRequestType.method, handler)
    }

    public onEndChat(handler: RequestHandler<EndChatParams, boolean, void>) {
        this.connection.onRequest(endChatRequestType.method, handler)
    }

    public onQuickAction(handler: RequestHandler<QuickActionParams, QuickActionResult, void>) {
        this.connection.onRequest(quickActionRequestType.method, handler)
    }

    public onSendFeedback(handler: NotificationHandler<FeedbackParams>) {
        this.connection.onNotification(feedbackNotificationType.method, handler)
    }

    public onReady(handler: NotificationHandler<void>) {
        this.connection.onNotification(readyNotificationType.method, handler)
    }

    public onTabAdd(handler: NotificationHandler<TabAddParams>) {
        this.connection.onNotification(tabAddNotificationType.method, handler)
    }

    public onTabChange(handler: NotificationHandler<TabChangeParams>) {
        this.connection.onNotification(tabChangeNotificationType.method, handler)
    }

    public onTabRemove(handler: NotificationHandler<TabRemoveParams>) {
        this.connection.onNotification(tabRemoveNotificationType.method, handler)
    }

    public onCodeInsertToCursorPosition(handler: NotificationHandler<InsertToCursorPositionParams>) {
        this.connection.onNotification(insertToCursorPositionNotificationType.method, handler)
    }

    public onLinkClick(handler: NotificationHandler<LinkClickParams>) {
        this.connection.onNotification(linkClickNotificationType.method, handler)
    }

    public onInfoLinkClick(handler: NotificationHandler<InfoLinkClickParams>) {
        this.connection.onNotification(infoLinkClickNotificationType.method, handler)
    }

    public onSourceLinkClick(handler: NotificationHandler<SourceLinkClickParams>) {
        this.connection.onNotification(sourceLinkClickNotificationType.method, handler)
    }

    public onFollowUpClicked(handler: NotificationHandler<FollowUpClickParams>) {
        this.connection.onNotification(followUpClickNotificationType.method, handler)
    }

    public sendUpdate(param: SendUpdateParams) {
        this.connection.sendNotification(sendUpdateNotificationType.method, param)
    }

    public onFileClicked(handler: NotificationHandler<FileClickParams>) {
        this.connection.onNotification(fileClickNotificationType.method, handler)
    }
}
