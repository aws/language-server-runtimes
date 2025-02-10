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
export interface TaskStatus {
    status: string
    isComplete: boolean
    detail?: string
}
export interface TaskFileList {
    filePaths?: string[]
    deletedFiles?: string[]
}
export interface TaskStep {
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
    step?: TaskStep
    actions?: TaskAction[]
}
export interface TaskStatusUpdateParams extends TaskStatusUpdate, TaskParams {}
