import {
    ManageTaskParams,
    ManageTaskResult,
    NotificationHandler,
    RequestHandler,
    TaskStatusUpdateParams,
} from '../protocol'

export type Agent = {
    // Requests
    onManageTask: (
        handler: RequestHandler<ManageTaskParams, ManageTaskResult | undefined | null, ManageTaskResult>
    ) => void
    // Notifications
    sendTaskStatusUpdate: (handler: NotificationHandler<TaskStatusUpdateParams>) => void
}
