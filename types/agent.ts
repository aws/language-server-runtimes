export const MANAGE_TASK_REQUEST_METHOD = 'aws/agent/manageTask'
export const TASK_STATE_UPDATE_NOTIFICATION_METHOD = 'aws/agent/sendTaskStateUpdate'

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
export type TaskStateType = 'Pending' | 'InProgress' | 'Complete' | 'Failed' | 'Cancelled' | string
export interface TaskState {
    state: TaskStateType
    detail?: string
}
export interface TaskStep {
    stepId: string
    title: string
    state: TaskStateType
    details?: string[]
}
export interface TaskContent {
    title: string
    steps?: TaskStep[]
}
export interface TaskAction {
    type: TaskActionType
}
export interface TaskStateUpdate {
    overview: TaskOverview
    state: TaskState
    contents?: TaskContent[]
    actions?: TaskAction[]
}
export interface TaskStateUpdateParams extends TaskStateUpdate, TaskParams {}
