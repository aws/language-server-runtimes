import { InitializeParams, InitializeResult, Logging } from '../../../server-interface'
import { LspServer } from './lspServer'
import { Connection } from 'vscode-languageserver/node'
import { Encoding } from '../../encoding'
import { DEFAULT_LOG_LEVEL, isValidLogLevel, LoggingImplementation, LogLevel } from '../../util/loggingUtil'

export class LoggingServer {
    private logger: Logging
    private lspServer: LspServer

    constructor(
        private lspConnection: Connection,
        private encoding: Encoding
    ) {
        this.logger = new LoggingImplementation(DEFAULT_LOG_LEVEL as LogLevel, this.lspConnection)
        this.lspServer = new LspServer(this.lspConnection, this.encoding, this.logger)
        this.lspServer.setInitializeHandler(async (params: InitializeParams): Promise<InitializeResult> => {
            this.updateLoggingLevel(params.initializationOptions?.logLevel ?? ('log' as LogLevel))
            return {
                capabilities: {},
            }
        })
        this.lspServer.setDidChangeConfigurationHandler(async params => {
            const logLevelConfig = await lspConnection.workspace.getConfiguration({
                section: 'aws.logLevel',
            })
            if (isValidLogLevel(logLevelConfig)) {
                this.updateLoggingLevel(logLevelConfig as LogLevel)
            }
        })
    }

    private updateLoggingLevel(logLevel: LogLevel) {
        this.logger.level = logLevel
    }

    public getLoggingObject(): Logging {
        return this.logger
    }

    public getLspServer(): LspServer {
        return this.lspServer
    }
}
