import {
    AwsResponseError,
    GetSsoTokenParams,
    GetSsoTokenResult,
    InvalidateSsoTokenParams,
    InvalidateSsoTokenResult,
    ListProfilesParams,
    ListProfilesResult,
    SsoTokenChangedParams,
    UpdateProfileParams,
    UpdateProfileResult,
    UpdateSsoTokenManagementParams,
    UpdateSsoTokenManagementResult,
} from '../protocol/identity-management'
import { RequestHandler } from '../protocol'

export * from '../protocol/identity-management'

export type IdentityManagement = {
    onListProfiles: (
        handler: RequestHandler<ListProfilesParams, ListProfilesResult | undefined | null, AwsResponseError>
    ) => void

    onUpdateProfile: (
        handler: RequestHandler<UpdateProfileParams, UpdateProfileResult | undefined | null, AwsResponseError>
    ) => void

    onGetSsoToken: (
        handler: RequestHandler<GetSsoTokenParams, GetSsoTokenResult | undefined | null, AwsResponseError>
    ) => void

    onInvalidateSsoToken: (
        handler: RequestHandler<InvalidateSsoTokenParams, InvalidateSsoTokenResult | undefined | null, AwsResponseError>
    ) => void

    onUpdateSsoTokenManagement: (
        handler: RequestHandler<
            UpdateSsoTokenManagementParams,
            UpdateSsoTokenManagementResult | undefined | null,
            AwsResponseError
        >
    ) => void

    sendSsoTokenChanged: (params: SsoTokenChangedParams) => void
}
