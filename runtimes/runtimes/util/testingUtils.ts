import sinon from 'sinon'
import {
    Logging,
    Lsp,
    IdentityManagement,
    Telemetry,
    Workspace,
    CredentialsProvider,
    Chat,
    Runtime,
    Notification,
} from '../../server-interface'

export function createStubFromInterface<T>(): sinon.SinonStubbedInstance<T> & T {
    const stub = {} as sinon.SinonStubbedInstance<T> & T
    return new Proxy(stub, {
        get: (target, property) => {
            if (property in target) {
                return target[property as keyof typeof target]
            }
            const method = sinon.stub()
            ;(target as any)[property] = method
            return method
        },
    })
}

export type Features = {
    chat: Chat
    credentialsProvider: CredentialsProvider
    lsp: Lsp
    workspace: Workspace
    logging: Logging
    telemetry: Telemetry
    runtime: Runtime
    identityManagement: IdentityManagement
    notification: Notification
}
