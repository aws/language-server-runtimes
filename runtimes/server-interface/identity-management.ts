import {
    GetSsoTokenError,
    GetSsoTokenParams,
    GetSsoTokenResult,
    InvalidateSsoTokenError,
    InvalidateSsoTokenParams,
    InvalidateSsoTokenResult,
    ListProfilesError,
    ListProfilesParams,
    ListProfilesResult,
    SsoTokenChangedParams,
    UpdateProfileError,
    UpdateProfileParams,
    UpdateProfileResult,
    UpdateSsoTokenManagementError,
    UpdateSsoTokenManagementParams,
    UpdateSsoTokenManagementResult,
} from '../protocol/identity-management'
import { RequestHandler } from '../protocol'

export * from '../protocol/identity-management'

export type IdentityManagement = {
    onListProfiles: (
        handler: RequestHandler<ListProfilesParams, ListProfilesResult | undefined | null, ListProfilesError>
    ) => void

    onUpdateProfile: (
        handler: RequestHandler<UpdateProfileParams, UpdateProfileResult | undefined | null, UpdateProfileError>
    ) => void

    onGetSsoToken: (
        handler: RequestHandler<GetSsoTokenParams, GetSsoTokenResult | undefined | null, GetSsoTokenError>
    ) => void

    onInvalidateSsoToken: (
        handler: RequestHandler<
            InvalidateSsoTokenParams,
            InvalidateSsoTokenResult | undefined | null,
            InvalidateSsoTokenError
        >
    ) => void

    onUpdateSsoTokenManagement: (
        handler: RequestHandler<
            UpdateSsoTokenManagementParams,
            UpdateSsoTokenManagementResult | undefined | null,
            UpdateSsoTokenManagementError
        >
    ) => void

    sendSsoTokenChanged: (params: SsoTokenChangedParams) => void
}
