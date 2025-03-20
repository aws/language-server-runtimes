import { URI, TextDocument } from './lsp'

/** Server to client. Used to ask the user to select a folder, if the workspace folder is too big */
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
    /** The initial version of the file. */
    originalFileUri: URI
    /** Indicates if the original file was deleted and fileContent contains the new/updated file contents. */
    isDeleted: boolean
    fileContent?: string
}
