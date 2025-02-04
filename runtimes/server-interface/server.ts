import {
    Logging,
    Lsp,
    Telemetry,
    Workspace,
    CredentialsProvider,
    Chat,
    Runtime,
    Notification,
    SDKInitializator,
} from '.'
import { IdentityManagement } from './identity-management'

/**
 * Servers are used to provide features to the client.
 *
 * Servers can make use of the {CredentialsProvider}, {Lsp}, {Workspace}, {Logging}, {Telemetry} and other features
 * to implement their functionality. Servers are notexpected to perform actions when their method
 * is called, but instead to set up listeners, event handlers, etc to handle.
 *
 * {CredentialsProvider}}, {Lsp}, and {Workspace} features may be initialized asynchronously, and can be empty until initialization
 * is completed and the client or user provides the necessary information. It's up to Server implementations to
 * either wait for the content to become available, or to gracefully handle cases where content is not yet available.
 *
 * The main use case for Servers is to listen to {Lsp} events and respond to these appropriately.
 *
 * @returns A function that will be called when the client exits, used to dispose of any held resources.
 */
export type Server = (features: Features) => () => void

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
    sdkInitializator: SDKInitializator
}
