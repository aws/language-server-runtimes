import { ManageTaskParams, ManageTaskResult, RequestHandler, TaskStateUpdateParams } from '../protocol'

export type Agent = {
    // Requests
    onManageTask: (
        handler: RequestHandler<ManageTaskParams, ManageTaskResult | undefined | null, ManageTaskResult>
    ) => void
    // Notifications
    sendTaskStateUpdate: (params: TaskStateUpdateParams) => void
}
