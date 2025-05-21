import {
    CopyFileParams,
    DID_APPEND_FILE_NOTIFICATION_METHOD,
    DID_COPY_FILE_NOTIFICATION_METHOD,
    DID_CREATE_DIRECTORY_NOTIFICATION_METHOD,
    DID_REMOVE_FILE_OR_DIRECTORY_NOTIFICATION_METHOD,
    DID_WRITE_FILE_NOTIFICATION_METHOD,
    FileParams,
    OPEN_FILE_DIFF_NOTIFICATION_METHOD,
    OpenFileDiffParams,
    ProtocolNotificationType,
    ProtocolRequestType,
    ResponseError,
    SELECT_WORKSPACE_ITEM_REQUEST_METHOD,
    SelectWorkspaceItemParams,
    SelectWorkspaceItemResult,
    URI,
} from './lsp'

export const selectWorkspaceItemRequestType = new ProtocolRequestType<
    SelectWorkspaceItemParams,
    SelectWorkspaceItemResult,
    never,
    void,
    void
>(SELECT_WORKSPACE_ITEM_REQUEST_METHOD)

export const openFileDiffNotificationType = new ProtocolNotificationType<OpenFileDiffParams, void>(
    OPEN_FILE_DIFF_NOTIFICATION_METHOD
)

export const didCopyFileNotificationType = new ProtocolNotificationType<CopyFileParams, void>(
    DID_COPY_FILE_NOTIFICATION_METHOD
)

export const didRemoveFileOrDirNotificationType = new ProtocolNotificationType<FileParams, void>(
    DID_REMOVE_FILE_OR_DIRECTORY_NOTIFICATION_METHOD
)

export const didWriteFileNotificationType = new ProtocolNotificationType<FileParams, void>(
    DID_WRITE_FILE_NOTIFICATION_METHOD
)

export const didAppendFileNotificationType = new ProtocolNotificationType<FileParams, void>(
    DID_APPEND_FILE_NOTIFICATION_METHOD
)

export const didCreateDirectoryNotificationType = new ProtocolNotificationType<FileParams, void>(
    DID_CREATE_DIRECTORY_NOTIFICATION_METHOD
)

export interface SaveWorkspaceDocumentParams {
    uri: string
}

export const saveWorkspaceDocumentRequestType = new ProtocolRequestType<
    SaveWorkspaceDocumentParams,
    boolean,
    never,
    ResponseError,
    void
>('aws/saveWorkspaceDocument')
