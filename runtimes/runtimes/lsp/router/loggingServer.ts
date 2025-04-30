import { InitializeParams, InitializeResult, Logging } from '../../../server-interface'
import { LspServer } from './lspServer'
import { Connection } from 'vscode-languageserver/node'
import { Encoding } from '../../encoding'
import { DEFAULT_LOG_LEVEL, isValidLogLevel, DefaultLogger, LogLevel } from '../../util/loggingUtil'

export class LoggingServer {
    private logger: DefaultLogger
    private lspServer: LspServer

    constructor(
        private lspConnection: Connection,
        private encoding: Encoding
    ) {
        this.logger = new DefaultLogger(DEFAULT_LOG_LEVEL, this.lspConnection)
        this.lspServer = new LspServer(this.lspConnection, this.encoding, this.logger)
        this.lspServer.setInitializeHandler((params: InitializeParams): Promise<InitializeResult> => {
            this.updateLoggingLevel(params.initializationOptions?.logLevel ?? ('log' as LogLevel))
            return Promise.resolve({
                capabilities: {},
            })
        })
        this.lspServer.setDidChangeConfigurationHandler(async _params => {
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
        this.logger.info(`Logging level changed to ${logLevel}`)
    }

    public getLoggingObject(): Logging {
        return this.logger
    }

    public getLspServer(): LspServer {
        return this.lspServer
    }
}
