import { LogLevel } from '../runtimes/util/loggingUtil'

/**
 * The logging feature interface
 */
export type Logging = {
    level: LogLevel
    error: (message: string) => void
    warn: (message: string) => void
    info: (message: string) => void
    log: (message: string) => void
    debug: (message: string) => void
}
