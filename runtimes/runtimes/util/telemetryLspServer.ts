import { Connection } from 'vscode-languageserver/node'
import { Encoding } from '../encoding'
import { Logging } from '../../server-interface/logging'
import { LspServer } from '../lsp/router/lspServer'
import { OperationalTelemetryProvider, TELEMETRY_SCOPES } from '../operational-telemetry/operational-telemetry'
import { RuntimeProps } from '../runtime'
import { OperationalTelemetryService } from '../operational-telemetry/operational-telemetry-service'
import { InitializeParams, InitializeResult } from '../../protocol'
import { Runtime } from '../../server-interface'

const DEFAULT_TELEMETRY_GATEWAY_ENDPOINT = ''
const DEFAULT_TELEMETRY_COGNITO_REGION = ''
const DEFAULT_TELEMETRY_COGNITO_POOL_ID = ''

function setMemoryUsageTelemetry() {
    const optel = OperationalTelemetryProvider.getTelemetryForScope(TELEMETRY_SCOPES.RUNTIMES)
    optel.registerGaugeProvider('ResourceUsageMetric', () => process.cpuUsage().user, { type: 'userCpuUsage' })
    optel.registerGaugeProvider('ResourceUsageMetric', () => process.cpuUsage().user, { type: 'systemCpuUsage' })
    optel.registerGaugeProvider('ResourceUsageMetric', () => process.memoryUsage().heapUsed, { type: 'heapUsed' })
    optel.registerGaugeProvider('ResourceUsageMetric', () => process.memoryUsage().heapTotal, { type: 'heapTotal' })
    optel.registerGaugeProvider('ResourceUsageMetric', () => process.memoryUsage().rss, { type: 'rss' })
}

function setServerCrashTelemetryListeners() {
    const optel = OperationalTelemetryProvider.getTelemetryForScope(TELEMETRY_SCOPES.RUNTIMES)

    // Handles both 'uncaughtException' and 'unhandledRejection'
    process.on('uncaughtExceptionMonitor', async (err, origin) => {
        optel.recordEvent('ServerCrashEvent', {
            crashType: origin,
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
        const region = runtime.getConfiguration('TELEMETRY_COGNITO_REGION') ?? DEFAULT_TELEMETRY_COGNITO_REGION
        const poolId = runtime.getConfiguration('TELEMETRY_COGNITO_POOL_ID') ?? DEFAULT_TELEMETRY_COGNITO_POOL_ID

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
