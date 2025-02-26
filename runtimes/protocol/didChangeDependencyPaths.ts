import {
    DID_CHANGE_DEPENDENCY_PATHS_NOTIFICATION_METHOD,
    DidChangeDependencyPathsParams,
    ProtocolNotificationType,
} from './lsp'

export const didChangeDependencyPathsNotificationType = new ProtocolNotificationType<
    DidChangeDependencyPathsParams,
    void
>(DID_CHANGE_DEPENDENCY_PATHS_NOTIFICATION_METHOD)
