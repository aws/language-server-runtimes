import { Logging } from '../../server-interface'
import { Connection, MessageType } from 'vscode-languageserver/node'

export type LogLevel = 'error' | 'warn' | 'info' | 'log' | 'debug'

const logLevelMap: Record<LogLevel, number> = {
    error: MessageType.Error,
    warn: MessageType.Warning,
    info: MessageType.Info,
    log: MessageType.Log,
    debug: MessageType.Debug,
}

export const isLogLevelEnabled = (l1: LogLevel, l2: LogLevel): boolean => {
    return logLevelMap[l1] >= logLevelMap[l2]
}

export const isValidLogLevel = (level: LogLevel): boolean => {
    return ['error', 'warn', 'info', 'log', 'debug'].includes(level)
}

export const DEFAULT_LOG_LEVEL: LogLevel = 'log'

export class LoggingImplementation implements Logging {
    public level: LogLevel
    private lspConnection: Connection

    constructor(level: LogLevel, connection: Connection) {
        this.level = level
        this.lspConnection = connection
    }

    error = (message: string) => {
        if (isLogLevelEnabled(this.level, 'error')) {
            this.lspConnection.console.error(`[${new Date().toISOString()}] ${message}`)
        }
    }
    warn = (message: string) => {
        if (isLogLevelEnabled(this.level, 'warn')) {
            this.lspConnection.console.warn(`[${new Date().toISOString()}] ${message}`)
        }
    }
    info = (message: string) => {
        if (isLogLevelEnabled(this.level, 'info')) {
            this.lspConnection.console.info(`[${new Date().toISOString()}] ${message}`)
        }
    }
    log = (message: string) => {
        if (isLogLevelEnabled(this.level, 'log')) {
            this.lspConnection.console.log(`[${new Date().toISOString()}] ${message}`)
        }
    }
    debug = (message: string) => {
        if (isLogLevelEnabled(this.level, 'debug')) {
            this.lspConnection.console.debug(`[${new Date().toISOString()}] ${message}`)
        }
    }
}
