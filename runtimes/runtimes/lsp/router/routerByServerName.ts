import { EventIdentifier, FollowupIdentifier, NotificationHandler } from '../../../protocol'
import { Encoding } from '../../encoding'

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

        const id = this.encoding.decode(params.source.id)
        if (this.parseServerName(id) === this.serverName) {
            params = {
                ...params,
                id,
            }
            followupHandler(params)
        }
    }

    private parseServerName(idJson: string): string | null {
        try {
            const { serverName } = JSON.parse(idJson) as NotificationId
            return serverName
        } catch (e) {
            return null
        }
    }
}
