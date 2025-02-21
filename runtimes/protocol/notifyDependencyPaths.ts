import {
    NOTIFY_DEPENDENCY_PATHS_NOTIFICATION_METHOD,
    NotifyDependencyPathsParams,
    ProtocolNotificationType,
} from './lsp'

export const notifyDependencyPathsNotificationType = new ProtocolNotificationType<NotifyDependencyPathsParams, void>(
    NOTIFY_DEPENDENCY_PATHS_NOTIFICATION_METHOD
)
