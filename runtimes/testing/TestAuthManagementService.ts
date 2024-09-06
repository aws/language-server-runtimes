import { AuthManagmentServiceHandlerFactory } from '../runtimes/services/authManagement'
import { ListProfilesParams } from '../protocol/authManagement'

/**
 * Example of implementation of AuthManagementService.
 * It implements handlers required to server AuthManagement calls,
 * proxied from integrating destination by AuthManagementService in ../runtimes/services/authManagementService.ts
 */
export const createAuthManagementService: AuthManagmentServiceHandlerFactory = () => ({
    listProfiles: (_params: ListProfilesParams) => {
        return {
            profiles: [],
            ssoSessions: [],
        }
    },
    updateProfile: () => {},
    getSsoToken: () => {},
    invalidateSsoToken: () => {},
    updateSsoTokenManagement: () => {},
    ssoTokenChanged: () => {},
})
