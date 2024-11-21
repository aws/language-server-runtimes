import { NotificationParams, NotificationFollowupParams, NotificationHandler } from '../protocol'

/*
 * The notification feature interface. To use the feature:
 * - Server must define "serverInfo" in initialize result of @type {PartialInitializeResult}.
 * - Notifications must contain id in @type {NotificationParams}
 */
export type Notification = {
    showNotification: (params: NotificationParams) => void
    onNotificationFollowup: (handler: NotificationHandler<NotificationFollowupParams>) => void
}
