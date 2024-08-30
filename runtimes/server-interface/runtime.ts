export type ServerInfo = {
    name: string
    version?: string
}

/**
 * The Runtime feature interface.
 */
export interface Runtime {
    /**
     * Information about runtime server, set in runtime props at build time.
     */
    serverInfo: ServerInfo
}
