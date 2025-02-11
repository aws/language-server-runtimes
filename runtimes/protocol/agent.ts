import {
    MANAGE_TASK_REQUEST_METHOD,
    ManageTaskParams,
    ManageTaskResult,
    ProtocolNotificationType,
    ProtocolRequestType,
    TASK_STATE_UPDATE_NOTIFICATION_METHOD,
    TaskStateUpdateParams,
} from './lsp'

export const manageTaskRequestType = new ProtocolRequestType<ManageTaskParams, ManageTaskResult, never, void, void>(
    MANAGE_TASK_REQUEST_METHOD
)
export const sendTaskStateUpdateNotificationType = new ProtocolNotificationType<TaskStateUpdateParams, void>(
    TASK_STATE_UPDATE_NOTIFICATION_METHOD
)
