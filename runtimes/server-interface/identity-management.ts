import {
    AwsResponseError,
    GetIamCredentialParams,
    GetIamCredentialResult,
    GetSsoTokenParams,
    GetSsoTokenResult,
    InvalidateSsoTokenParams,
    InvalidateSsoTokenResult,
    InvalidateIamCredentialParams,
    InvalidateIamCredentialResult,
    ListProfilesParams,
    ListProfilesResult,
    SsoTokenChangedParams,
    UpdateProfileParams,
    UpdateProfileResult,
    DeleteProfileParams,
    DeleteProfileResult,
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

    onGetIamCredential: (
        handler: RequestHandler<GetIamCredentialParams, GetIamCredentialResult | undefined | null, AwsResponseError>
    ) => void

    onDeleteProfile: (
        handler: RequestHandler<DeleteProfileParams, DeleteProfileResult | undefined | null, AwsResponseError>
    ) => void

    onInvalidateSsoToken: (
        handler: RequestHandler<InvalidateSsoTokenParams, InvalidateSsoTokenResult | undefined | null, AwsResponseError>
    ) => void

    onInvalidateIamCredential: (
        handler: RequestHandler<
            InvalidateIamCredentialParams,
            InvalidateIamCredentialResult | undefined | null,
            AwsResponseError
        >
    ) => void

    sendSsoTokenChanged: (params: SsoTokenChangedParams) => void
}
