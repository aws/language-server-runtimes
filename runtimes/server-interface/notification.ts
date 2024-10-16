import { NotificationParams, NotificationFollowupParams, NotificationHandler } from '../protocol'

export type Notification = {
    showNotification: (params: NotificationParams) => void
    onNotificationFollowup: (handler: NotificationHandler<NotificationFollowupParams>) => void
}
