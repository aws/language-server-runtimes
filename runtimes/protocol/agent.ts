import {
    MANAGE_TASK_REQUEST_METHOD,
    ManageTaskParams,
    ManageTaskResult,
    ProtocolNotificationType,
    ProtocolRequestType,
    TASK_STATUS_UPDATE_NOTIFICATION_METHOD,
    TaskStatusUpdateParams,
} from './lsp'

export const manageTaskRequestType = new ProtocolRequestType<ManageTaskParams, ManageTaskResult, never, void, void>(
    MANAGE_TASK_REQUEST_METHOD
)
export const sendTaskStatusUpdateNotificationType = new ProtocolNotificationType<TaskStatusUpdateParams, void>(
    TASK_STATUS_UPDATE_NOTIFICATION_METHOD
)
