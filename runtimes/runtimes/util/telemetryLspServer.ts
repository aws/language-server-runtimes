import { Connection, InitializeParams, InitializeResult } from 'vscode-languageserver/node'
import { Encoding } from '../encoding'
import { Logging } from '../../server-interface/logging'
import { LspServer } from '../lsp/router/lspServer'
import { OperationalTelemetryProvider, TelemetryStatus } from '../operational-telemetry/operational-telemetry'

export function getTelmetryLspServer(lspConnection: Connection, encoding: Encoding, logging: Logging): LspServer {
    const lspServer = new LspServer(lspConnection, encoding, logging)
    lspServer.setInitializeHandler(async (params: InitializeParams): Promise<InitializeResult> => {
        const optOut: boolean = params.initializationOptions?.telemetryOptOut ?? false

        let status = TelemetryStatus.Enabled
        if (optOut) {
            status = TelemetryStatus.Disabled
        }

        OperationalTelemetryProvider.getTelemetryForScope('').updateTelemetryStatus(status)

        return {
            capabilities: {},
        }
    })
    lspServer.setDidChangeConfigurationHandler(async params => {
        const optOut = (await lspConnection.workspace.getConfiguration({
            section: 'aws.q.optOutTelemetry',
        })) as boolean

        let status = TelemetryStatus.Enabled
        if (optOut) {
            status = TelemetryStatus.Disabled
        }

        OperationalTelemetryProvider.getTelemetryForScope('').updateTelemetryStatus(status)
    })

    return lspServer
}
