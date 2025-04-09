import { EventIdentifier, FollowupIdentifier, NotificationHandler } from '../../../protocol'
import { Encoding } from '../../encoding'
import { OperationalTelemetryProvider, TELEMETRY_SCOPES } from '../../operational-telemetry/operational-telemetry'

type NotificationId = {
    serverName: string
    id: string
}

export class RouterByServerName<P extends Partial<EventIdentifier>, F extends FollowupIdentifier> {
    constructor(
        private serverName: string,
        private encoding: Encoding
    ) {}

    send(sendHandler: (params: P) => Promise<void>, params: P) {
        const attachServerName = (): P => {
            const idObject = {
                serverName: this.serverName,
                id: params.id!,
            }
            const id = this.encoding.encode(JSON.stringify(idObject))
            return {
                ...params,
                id,
            }
        }

        const sendParams = params.id ? attachServerName() : params
        sendHandler(sendParams)
    }

    processFollowup(followupHandler: NotificationHandler<F>, params: F) {
        if (!params.source.id) {
            return
        }

        const sourceId = this.encoding.decode(params.source.id)
        const id = this.parseServerName(sourceId)
        if (id?.serverName === this.serverName) {
            params = {
                ...params,
                source: {
                    id: id.id,
                },
            }
            followupHandler(params)
        }
    }

    private parseServerName(idJson: string): NotificationId | null {
        try {
            return JSON.parse(idJson) as NotificationId
        } catch (error: any) {
            OperationalTelemetryProvider.getTelemetryForScope(TELEMETRY_SCOPES.RUNTIMES).recordEvent('ErrorEvent', {
                errorOrigin: 'caughtError',
                errorType: 'routerServerNameParse',
                errorName: error?.name ?? 'unknown',
                errorCode: error?.code ?? '',
            })
            return null
        }
    }
}
