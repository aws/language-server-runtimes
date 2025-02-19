import { Connection } from 'vscode-languageserver/node'
import { Encoding } from '../encoding'
import { Logging } from '../../server-interface/logging'
import { LspServer } from '../lsp/router/lspServer'
import { OperationalTelemetryProvider } from '../operational-telemetry/operational-telemetry'
import { RuntimeProps } from '../runtime'
import { OperationalTelemetryService } from '../operational-telemetry/operational-telemetry-service'
import { InitializeParams, InitializeResult } from '../../protocol'

export function getTelmetryLspServer(
    lspConnection: Connection,
    encoding: Encoding,
    logging: Logging,
    props: RuntimeProps
): LspServer {
    const lspServer = new LspServer(lspConnection, encoding, logging)

    lspServer.setInitializeHandler(async (params: InitializeParams): Promise<InitializeResult> => {
        const optOut = params.initializationOptions?.telemetryOptOut ?? true // telemetry disabled if option not provided

        // const optel = OperationalTelemetryService.getInstance({
        //     serviceName: props.name,
        //     serviceVersion: props.version,
        //     extendedClientInfo: params.initializationOptions?.aws?.clientInfo,
        //     lspConsole: lspConnection.console,
        //     poolId: '',
        //     region: '',
        //     endpoint: '',
        //     telemetryOptOut: optOut,
        // })

        // OperationalTelemetryProvider.setTelemetryInstance(optel)

        return {
            capabilities: {},
        }
    })

    lspServer.setDidChangeConfigurationHandler(async params => {
        const optOut = await lspConnection.workspace.getConfiguration({
            section: 'aws.optOutTelemetry',
        })

        if (typeof optOut === 'boolean') {
            OperationalTelemetryProvider.getTelemetryForScope('').toggleOptOut(optOut)
        }
    })

    return lspServer
}
