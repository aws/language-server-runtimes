import { Connection } from 'vscode-languageserver/node'
import { Encoding } from '../encoding'
import { Logging } from '../../server-interface/logging'
import { LspServer } from '../lsp/router/lspServer'
import { OperationalTelemetryProvider, TELEMETRY_SCOPES } from '../operational-telemetry/operational-telemetry'
import { RuntimeProps } from '../runtime'
import { InitializeParams, InitializeResult } from '../../protocol'
import { Runtime } from '../../server-interface'
import { totalmem } from 'os'

const DEFAULT_TELEMETRY_GATEWAY_ENDPOINT = ''

function setMemoryUsageTelemetry() {
    const optel = OperationalTelemetryProvider.getTelemetryForScope(TELEMETRY_SCOPES.RUNTIMES)
    optel.registerGaugeProvider('heapTotal', () => process.memoryUsage().heapTotal, 'byte')
    optel.registerGaugeProvider('heapUsed', () => process.memoryUsage().heapUsed, 'byte')
    optel.registerGaugeProvider('rss', () => process.memoryUsage().rss, 'byte')
    optel.registerGaugeProvider('userCpuUsage', () => process.cpuUsage().user, 'second')
    optel.registerGaugeProvider('systemCpuUsage', () => process.cpuUsage().system, 'second')
    optel.registerGaugeProvider('memoryUsage', () => (process.memoryUsage().rss / totalmem()) * 100, 'percent')
}

function setServerCrashTelemetryListeners() {
    const optel = OperationalTelemetryProvider.getTelemetryForScope(TELEMETRY_SCOPES.RUNTIMES)

    // Handles both 'uncaughtException' and 'unhandledRejection'
    process.on('uncaughtExceptionMonitor', async (err, origin) => {
        optel.emitEvent({
            errorOrigin: origin,
            errorType: 'unknownServerCrash',
            errorName: err?.name ?? 'unknown',
        })
    })
}

export function getTelemetryLspServer(
    lspConnection: Connection,
    encoding: Encoding,
    logging: Logging,
    props: RuntimeProps,
    runtime: Runtime
): LspServer {
    const lspServer = new LspServer(lspConnection, encoding, logging)

    lspServer.setInitializeHandler(async (params: InitializeParams): Promise<InitializeResult> => {
        const optOut = params.initializationOptions?.telemetryOptOut ?? true // telemetry disabled if option not provided

        const endpoint = runtime.getConfiguration('TELEMETRY_GATEWAY_ENDPOINT') ?? DEFAULT_TELEMETRY_GATEWAY_ENDPOINT

        // const optel = OperationalTelemetryService.getInstance({
        //     serviceName: props.name,
        //     serviceVersion: props.version,
        //     extendedClientInfo: params.initializationOptions?.aws?.clientInfo,
        //     lspConsole: lspConnection.console,
        //     endpoint: endpoint,
        //     telemetryOptOut: optOut,
        // })

        // OperationalTelemetryProvider.setTelemetryInstance(optel)

        setServerCrashTelemetryListeners()
        setMemoryUsageTelemetry()

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
            setMemoryUsageTelemetry()
        }
    })

    return lspServer
}
