import { Logging } from '../../server-interface'
import { Connection } from 'vscode-languageserver/node'

export type LogLevel = 'error' | 'warn' | 'info' | 'log' | 'debug'

const logLevelMap: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    log: 3,
    debug: 4,
}

export const isLogLevelEnabled = (l1: LogLevel, l2: LogLevel): boolean => {
    return logLevelMap[l1] >= logLevelMap[l2]
}

export const isValidLogLevel = (level: LogLevel): boolean => {
    return level && typeof level === 'string' && ['fatal', 'error', 'warn', 'info', 'log', 'debug'].includes(level)
}

const DEFAULT_LOG_LEVEL: LogLevel = 'log'

export const getLogLevel = async (lspConnection: Connection): Promise<LogLevel> => {
    const logLevelConfig = await lspConnection.workspace.getConfiguration({
        section: 'logLevel',
    })
    return isValidLogLevel(logLevelConfig) ? logLevelConfig : DEFAULT_LOG_LEVEL
}

export const getLoggingUtility = async (lspConnection: Connection): Promise<Logging> => {
    let logLevel: LogLevel
    try {
        logLevel = await getLogLevel(lspConnection)
    } catch {
        logLevel = DEFAULT_LOG_LEVEL
    }

    const logging: Logging = {
        level: logLevel,
        error: message => {
            if (isLogLevelEnabled(logLevel, 'error')) {
                lspConnection.console.error(`[${new Date().toISOString()}] ${message}`)
            }
        },
        warn: message => {
            if (isLogLevelEnabled(logLevel, 'warn')) {
                lspConnection.console.warn(`[${new Date().toISOString()}] ${message}`)
            }
        },
        info: message => {
            if (isLogLevelEnabled(logLevel, 'info')) {
                lspConnection.console.info(`[${new Date().toISOString()}] ${message}`)
            }
        },
        log: message => {
            if (isLogLevelEnabled(logLevel, 'log')) {
                lspConnection.console.log(`[${new Date().toISOString()}] ${message}`)
            }
        },
        debug: message => {
            if (isLogLevelEnabled(logLevel, 'debug')) {
                lspConnection.console.debug(`[${new Date().toISOString()}] ${message}`)
            }
        },
    }
    return logging
}
