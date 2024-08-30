/**
 * The Runtime feature interface.
 */
export type Runtime = {
    /**
     * Information about runtime server, set in runtime props at build time.
     */
    serverInfo: {
        name: string
        version?: string
    }
}
