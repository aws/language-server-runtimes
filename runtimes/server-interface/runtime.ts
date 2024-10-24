export type ServerInfo = {
    name: string
    version?: string
}

export type Platform = NodeJS.Platform | 'browser'

/**
 * The Runtime feature interface.
 */
export interface Runtime {
    /**
     * Information about runtime server, set in runtime props at build time.
     */
    serverInfo: ServerInfo

    /**
     * Platform where the runtime is running.
     * Set to NodeJS.Platform for standalone and 'browser' for webworker runtime.
     */
    platform: Platform
}
