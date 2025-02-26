export const DID_CHANGE_DEPENDENCY_PATHS_NOTIFICATION_METHOD = 'aws/didChangeDependencyPaths'

/**
 * Parameters for notifying AWS language server about dependency paths
 */
export interface DidChangeDependencyPathsParams {
    /** Name of the module being processed */
    moduleName: string
    /** Programming language runtime (e.g., 'javascript', 'python', 'java') */
    runtimeLanguage: string
    /** Absolute paths to dependency files and directories*/
    paths: string[]
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
