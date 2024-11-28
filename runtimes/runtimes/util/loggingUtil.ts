import { Logging } from '../../server-interface'
import { Connection, MessageType } from 'vscode-languageserver/node'

const LOG_LEVELS = {
    error: MessageType.Error,
    warn: MessageType.Warning,
    info: MessageType.Info,
    log: MessageType.Log,
    debug: MessageType.Debug,
} as const

export type LogLevel = keyof typeof LOG_LEVELS

export const isLogLevelEnabled = (l1: LogLevel, l2: LogLevel): boolean => {
    return LOG_LEVELS[l1] >= LOG_LEVELS[l2]
}

export const isValidLogLevel = (level: LogLevel): boolean => {
    return Object.keys(LOG_LEVELS).includes(level)
}

export const DEFAULT_LOG_LEVEL: LogLevel = 'log'

export class DefaultLogger implements Logging {
    public level: LogLevel
    private lspConnection: Connection

    constructor(level: LogLevel, connection: Connection) {
        this.level = level
        this.lspConnection = connection
    }

    sendToLog(logLevel: LogLevel, message: string): void {
        if (isLogLevelEnabled(this.level, logLevel)) {
            this.lspConnection.console[logLevel](`[${new Date().toISOString()}] ${message}`)
        }
    }

    error = (message: string) => this.sendToLog('error', message)
    warn = (message: string) => this.sendToLog('warn', message)
    info = (message: string) => this.sendToLog('info', message)
    log = (message: string) => this.sendToLog('log', message)
    debug = (message: string) => this.sendToLog('debug', message)
}
