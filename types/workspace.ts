import { URI } from './lsp'

export const SELECT_WORKSPACE_ITEM_REQUEST_METHOD = 'aws/selectWorkspaceItem'
export const OPEN_FILE_DIFF_NOTIFICATION_METHOD = 'aws/openFileDiff'

export const DID_COPY_FILE_NOTIFICATION_METHOD = 'aws/didCopyFile'
export const DID_WRITE_FILE_NOTIFICATION_METHOD = 'aws/didWriteFile'
export const DID_APPEND_FILE_NOTIFICATION_METHOD = 'aws/didAppendFile'
export const DID_REMOVE_FILE_OR_DIRECTORY_NOTIFICATION_METHOD = 'aws/didRemoveFileOrDirectory'
export const DID_CREATE_DIRECTORY_NOTIFICATION_METHOD = 'aws/didCreateDirectory'
export const OPEN_WORKSPACE_FILE_REQUEST_METHOD = 'aws/openWorkspaceFile'

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
    originalFileContent?: string
    isDeleted: boolean
    fileContent?: string
}

export interface CopyFileParams {
    oldPath: string
    newPath: string
}

export interface FileParams {
    path: string
}

export interface OpenWorkspaceFileParams {
    filePath: string
    makeActive?: boolean
}

export interface OpenWorkspaceFileResult {
    success: boolean
}
