/**
 * The logging feature interface
 */
export type Logging = {
    error: (message: string) => void
    warn: (message: string) => void
    info: (message: string) => void
    log: (message: string) => void
    debug: (message: string) => void
}
