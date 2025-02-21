export const NOTIFY_DEPENDENCY_PATHS_NOTIFICATION_METHOD = 'aws/notifyDependencyPaths'

export interface NotifyDependencyPathsParams {
    moduleName: string
    programmingLangugage: string
    files: string[]
    dirs: string[]
    includePatterns?: string[]
    excludePatterns?: string[]
}
