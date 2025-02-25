export const NOTIFY_DEPENDENCY_PATHS_NOTIFICATION_METHOD = 'aws/notifyDependencyPaths'

/**
 * Parameters for notifying AWS language server about dependency paths
 */
export interface NotifyDependencyPathsParams {
    /** Name of the module being processed */
    moduleName: string
    /** Programming language runtime (e.g., 'javascript', 'python', 'java') */
    runtimeLanguage: string
    /** Absolute paths to dependency files*/
    files: string[]
    /** Absolute paths to dependency directories*/
    dirs: string[]
    /**
     * Glob patterns to include specific files/directories
     * Patterns should conform to https://github.com/isaacs/node-glob
     * @optional
     */
    includePatterns?: string[]
    /**
     * Glob patterns to exclude specific files/directories
     * Patterns should conform to https://github.com/isaacs/node-glob
     * @optional
     */
    excludePatterns?: string[]
}
