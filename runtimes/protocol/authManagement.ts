import { ProtocolRequestType } from './lsp'

export type ListProfilesParams = {}
export type ListProfilesResult = {
    profiles?: any[]
    ssoSessions?: any[]
}
export type ListProfilesError = {}
export const listProfilesRequestType = new ProtocolRequestType<
    ListProfilesParams,
    ListProfilesResult,
    never,
    ListProfilesError,
    void
>('aws/auth/profiles')

// TODO: define rest of protocol here
// updateProfile
// getSsoToken
// invalidateSsoToken
// updateSsoTokenManagement
// ssoTokenChanged
