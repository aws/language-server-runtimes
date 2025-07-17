import {
    AwsResponseError,
    GetIamCredentialParams,
    GetIamCredentialResult,
    GetSsoTokenParams,
    GetSsoTokenResult,
    InvalidateSsoTokenParams,
    InvalidateSsoTokenResult,
    InvalidateStsCredentialParams,
    InvalidateStsCredentialResult,
    ListProfilesParams,
    ListProfilesResult,
    GetMfaCodeParams,
    SsoTokenChangedParams,
    StsCredentialChangedParams,
    UpdateProfileParams,
    UpdateProfileResult,
    GetMfaCodeResult,
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

    onInvalidateSsoToken: (
        handler: RequestHandler<InvalidateSsoTokenParams, InvalidateSsoTokenResult | undefined | null, AwsResponseError>
    ) => void

    onInvalidateStsCredential: (
        handler: RequestHandler<
            InvalidateStsCredentialParams,
            InvalidateStsCredentialResult | undefined | null,
            AwsResponseError
        >
    ) => void

    sendSsoTokenChanged: (params: SsoTokenChangedParams) => void

    sendStsCredentialChanged: (params: StsCredentialChangedParams) => void

    sendGetMfaCode: (params: GetMfaCodeParams) => Promise<GetMfaCodeResult>
}
