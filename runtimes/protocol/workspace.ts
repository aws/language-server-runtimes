import {
    OPEN_FILE_DIFF_NOTIFICATION_METHOD,
    OpenFileDiffParams,
    ProtocolNotificationType,
    ProtocolRequestType,
    SELECT_WORKSPACE_ITEM_REQUEST_METHOD,
    SelectWorkspaceItemParams,
    SelectWorkspaceItemResult,
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
