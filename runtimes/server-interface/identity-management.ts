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

// As the aws-lsp-identity server needs access to all the param/result/error types for requests/notifications because
// it is solely responsible for handling them, export all of the protocol/identity-management to server-interface/identity-management.
// Do not export any types here to server-interface/index.ts as only the aws-lsp-identity server should be using these types.

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
