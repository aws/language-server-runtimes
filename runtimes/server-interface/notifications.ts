import { NotificationsParams, NotificationFollowupParams, NotificationHandler } from '../protocol'

export type Notifications = {
    showNotifications: (params: NotificationsParams) => void
    onNotificationFollowup: (handler: NotificationHandler<NotificationFollowupParams>) => void
}
