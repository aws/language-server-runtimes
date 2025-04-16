import { Connection } from 'vscode-languageserver/node'
import { Encoding } from '../encoding'
import { Logging } from '../../server-interface/logging'
import { LspServer } from '../lsp/router/lspServer'
import { OperationalTelemetryProvider, TELEMETRY_SCOPES } from '../operational-telemetry/operational-telemetry'
import { RuntimeProps } from '../runtime'
import { InitializeParams, InitializeResult } from '../../protocol'
import { Runtime } from '../../server-interface'

const DEFAULT_TELEMETRY_GATEWAY_ENDPOINT = ''
const DEFAULT_TELEMETRY_COGNITO_REGION = ''
const DEFAULT_TELEMETRY_COGNITO_POOL_ID = ''

function setMemoryUsageTelemetry() {
    const optel = OperationalTelemetryProvider.getTelemetryForScope(TELEMETRY_SCOPES.RUNTIMES)
    optel.registerGaugeProvider('ResourceUsageMetric', {
        userCpuUsage: () => process.cpuUsage().user,
        systemCpuUsage: () => process.cpuUsage().system,
        heapUsed: () => process.memoryUsage().heapUsed,
        heapTotal: () => process.memoryUsage().heapTotal,
        rss: () => process.memoryUsage().rss,
    })
}

function setServerCrashTelemetryListeners() {
    const optel = OperationalTelemetryProvider.getTelemetryForScope(TELEMETRY_SCOPES.RUNTIMES)

    // Handles both 'uncaughtException' and 'unhandledRejection'
    process.on('uncaughtExceptionMonitor', (err, origin) => {
        optel.recordEvent('ErrorEvent', {
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

    lspServer.setInitializeHandler((params: InitializeParams): Promise<InitializeResult> => {
        const _optOut = params.initializationOptions?.telemetryOptOut ?? true // telemetry disabled if option not provided

        const _endpoint = runtime.getConfiguration('TELEMETRY_GATEWAY_ENDPOINT') ?? DEFAULT_TELEMETRY_GATEWAY_ENDPOINT
        const _region = runtime.getConfiguration('TELEMETRY_COGNITO_REGION') ?? DEFAULT_TELEMETRY_COGNITO_REGION
        const _poolId = runtime.getConfiguration('TELEMETRY_COGNITO_POOL_ID') ?? DEFAULT_TELEMETRY_COGNITO_POOL_ID

        // const optel = OperationalTelemetryService.getInstance({
        //     serviceName: props.name,
        //     serviceVersion: props.version,
        //     extendedClientInfo: params.initializationOptions?.aws?.clientInfo,
        //     lspConsole: lspConnection.console,
        //     poolId: poolId,
        //     region: region,
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

    lspServer.setDidChangeConfigurationHandler(async _params => {
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
