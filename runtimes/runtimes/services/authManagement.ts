import { Connection } from 'vscode-languageserver'
import { CredentialsEncoding } from '../auth/standalone/encryption'
import {
    ListProfilesError,
    ListProfilesParams,
    ListProfilesResult,
    listProfilesRequestType,
} from '../../protocol/authManagement'

export type AuthManagmentServiceHandlerFactory = () => {
    listProfiles: (params: ListProfilesParams) => ListProfilesResult | ListProfilesError
    // TODO: define the rest of the handlers
    updateProfile: () => void
    getSsoToken: () => void
    invalidateSsoToken: () => void
    updateSsoTokenManagement: () => void
    ssoTokenChanged: () => void
}

/**
 * Service registers LSP method handlers and binds them to registered Service implementation handlers.
 */
export class AuthManagement {
    constructor(
        private readonly connection: Connection,
        private readonly handlersFactory: AuthManagmentServiceHandlerFactory,
        key?: string,
        encoding?: CredentialsEncoding
    ) {
        // Working with encoding messages will be encapsulated in the runtime Service.

        this.registerHandlers()
    }

    private registerHandlers() {
        const handlers = this.handlersFactory()

        this.connection.onRequest(listProfilesRequestType, handlers.listProfiles)

        // TODO: register rest of handlers here
        // updateProfile
        // getSsoToken
        // invalidateSsoToken
        // updateSsoTokenManagement
        // ssoTokenChanged
    }
}
