import { MessageType, ProtocolNotificationType } from './lsp'

export interface EventIdentifier {
    readonly id: string
}

export interface FollowupIdentifier {
    readonly source: EventIdentifier
}

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

export interface NotificationParams extends Partial<EventIdentifier> {
    readonly type: MessageType
    readonly content: NotificationContent
    readonly actions?: NotificationAction[]
}

export interface NotificationFollowupParams extends FollowupIdentifier {
    readonly action: FollowupNotificationActionType
}

/**
 * showNotificationRequestType defines the custom method that the language server
 * sends to the client to provide notifications to show to customers.
 */
export const showNotificationRequestType = new ProtocolNotificationType<NotificationParams, void>(
    'aws/window/showNotification'
)

/**
 * notificationFollowupRequestType defines the custom method that the language client
 * sends to the server to provide asynchronous customer followup to notification shown.
 * This method is expected to be used only for notification that require followup.
 *
 * Client is responsible for passing `id` of source notification that triggered the followup notification
 * in the parameters.
 */
export const notificationFollowupRequestType = new ProtocolNotificationType<NotificationFollowupParams, void>(
    'aws/window/notificationFollowup'
)
