export const MANAGE_TASK_REQUEST_METHOD = 'aws/agent/manageTask'
export const TASK_STATUS_UPDATE_NOTIFICATION_METHOD = 'aws/agent/sendTaskStatusUpdate'

export interface TaskParams {
    taskId: string
}

export type TaskActionType = 'Start' | 'Stop' | string
export interface ManageTaskParams extends TaskParams {
    action: TaskActionType
}
export interface ManageTaskResult extends TaskParams {
    success: boolean
}

export interface TaskOverview {
    title: string
    description: string
}
export type TaskStatusType = 'Pending' | 'InProgress' | 'Complete' | 'Cancelled' | string
export interface TaskStatus {
    status: TaskStatusType
    detail?: string
}
export interface TaskFileList {
    filePaths?: string[]
    deletedFiles?: string[]
}
export interface TaskStep {
    stepId: string
    step: string
    detail?: string
    fileList?: TaskFileList
}
export interface TaskAction {
    type: TaskActionType
}
export interface TaskStatusUpdate {
    overview: TaskOverview
    status: TaskStatus
    steps?: TaskStep[]
    actions?: TaskAction[]
}
export interface TaskStatusUpdateParams extends TaskStatusUpdate, TaskParams {}
