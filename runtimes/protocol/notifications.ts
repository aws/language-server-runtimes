import { MessageType, ProtocolNotificationType } from './lsp'

export interface NotificationContent {
    readonly text: string
    readonly title?: string
}

export namespace FollowupNotificationActionType {
    export const Acknowledge = 'Acknowledge'
}

export type FollowupNotificationActionType = typeof FollowupNotificationActionType.Acknowledge

export namespace NotificationActionType {
    export const Url = 'Url'
    export const Marketplace = 'Marketplace'
}

export type NotificationActionType =
    | typeof NotificationActionType.Url
    | typeof NotificationActionType.Marketplace
    | typeof FollowupNotificationActionType.Acknowledge

export interface NotificationAction {
    readonly text: string
    readonly type: NotificationActionType
}

export interface UrlAction extends NotificationAction {
    readonly type: typeof NotificationActionType.Url
    readonly url: string
}

export interface MarketplaceAction extends NotificationAction {
    readonly type: typeof NotificationActionType.Marketplace
}

export interface AcknowledgeRequestAction extends NotificationAction {
    readonly type: typeof FollowupNotificationActionType.Acknowledge
}

export interface Notification {
    readonly id?: string
    readonly type: MessageType
    readonly content: NotificationContent
    readonly actions?: NotificationAction[]
}

export interface NotificationsParams {
    readonly notifications: Notification[]
}

export interface NotificationFollowupParams {
    readonly id: string
    readonly actions: FollowupNotificationActionType[]
}

/**
 * showNotificationsRequestType defines the custom method that the language server
 * sends to the client to provide notifications to show to customers.
 */
export const showNotificationsRequestType = new ProtocolNotificationType<NotificationsParams, void>(
    'aws/window/showNotifications'
)

/**
 * notificationFollowupRequestType defines the custom method that the language client
 * sends to the server to provide asynchronous customer followup to notification shown.
 * This method is optional per notification, as not notifications require followup.
 */
export const notificationFollowupRequestType = new ProtocolNotificationType<NotificationFollowupParams, void>(
    'aws/window/notificationFollowup'
)
