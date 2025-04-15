import { URI } from './lsp'

export const SELECT_WORKSPACE_ITEM_REQUEST_METHOD = 'aws/selectWorkspaceItem'
export const OPEN_FILE_DIFF_NOTIFICATION_METHOD = 'aws/openFileDiff'

export interface SelectWorkspaceItemParams {
    canSelectFolders: boolean
    canSelectFiles: boolean
    canSelectMany: boolean
    title?: string
}
export interface WorkspaceItem {
    uri: URI
    name?: string
}
export interface SelectWorkspaceItemResult {
    items: WorkspaceItem[]
}

export interface OpenFileDiffParams {
    originalFileUri: URI
    isDeleted: boolean
    fileContent?: string
}
