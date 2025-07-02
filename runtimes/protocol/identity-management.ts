import {
    IamCredentials,
    LSPErrorCodes,
    ProgressType,
    ProtocolNotificationType,
    ProtocolRequestType,
    ResponseError,
    UpdateCredentialsParams,
} from './lsp'

// Errors
export const AwsErrorCodes = {
    E_CANNOT_CREATE_PROFILE: 'E_CANNOT_CREATE_PROFILE',
    E_CANNOT_CREATE_SSO_SESSION: 'E_CANNOT_CREATE_SSO_SESSION',
    E_CANNOT_OVERWRITE_PROFILE: 'E_CANNOT_OVERWRITE_PROFILE',
    E_CANNOT_OVERWRITE_SSO_SESSION: 'E_CANNOT_OVERWRITE_SSO_SESSION',
    E_CANNOT_READ_SHARED_CONFIG: 'E_CANNOT_READ_SHARED_CONFIG',
    E_CANNOT_READ_SSO_CACHE: 'E_CANNOT_READ_SSO_CACHE',
    E_CANNOT_READ_STS_CACHE: 'E_CANNOT_READ_STS_CACHE',
    E_CANNOT_REFRESH_SSO_TOKEN: 'E_CANNOT_REFRESH_SSO_TOKEN',
    E_CANNOT_REFRESH_STS_CREDENTIAL: 'E_CANNOT_REFRESH_STS_CREDENTIAL',
    E_CANNOT_REGISTER_CLIENT: 'E_CANNOT_REGISTER_CLIENT',
    E_CANNOT_CREATE_SSO_TOKEN: 'E_CANNOT_CREATE_SSO_TOKEN',
    E_CANNOT_CREATE_STS_CREDENTIAL: 'E_CANNOT_CREATE_STS_CREDENTIAL',
    E_CANNOT_WRITE_SHARED_CONFIG: 'E_CANNOT_WRITE_SHARED_CONFIG',
    E_CANNOT_WRITE_SSO_CACHE: 'E_CANNOT_WRITE_SSO_CACHE',
    E_CANNOT_WRITE_STS_CACHE: 'E_CANNOT_WRITE_STS_CACHE',
    E_ENCRYPTION_REQUIRED: 'E_ENCRYPTION_REQUIRED',
    E_INVALID_PROFILE: 'E_INVALID_PROFILE',
    E_INVALID_SSO_CLIENT: 'E_INVALID_SSO_CLIENT',
    E_INVALID_SSO_SESSION: 'E_INVALID_SSO_SESSION',
    E_INVALID_SSO_TOKEN: 'E_INVALID_SSO_TOKEN',
    E_INVALID_STS_CREDENTIAL: 'E_INVALID_STS_CREDENTIAL',
    E_PROFILE_NOT_FOUND: 'E_PROFILE_NOT_FOUND',
    E_RUNTIME_NOT_SUPPORTED: 'E_RUNTIME_NOT_SUPPORTED',
    E_SSO_SESSION_NOT_FOUND: 'E_SSO_SESSION_NOT_FOUND',
    E_SSO_TOKEN_EXPIRED: 'E_SSO_TOKEN_EXPIRED',
    E_STS_CREDENTIAL_EXPIRED: 'E_STS_CREDENTIAL_EXPIRED',
    E_SSO_TOKEN_SOURCE_NOT_SUPPORTED: 'E_SSO_TOKEN_SOURCE_NOT_SUPPORTED',
    E_TIMEOUT: 'E_TIMEOUT',
    E_UNKNOWN: 'E_UNKNOWN',
    E_CANCELLED: 'E_CANCELLED',
} as const

export interface AwsResponseErrorData {
    awsErrorCode: string
}

export class AwsResponseError extends ResponseError<AwsResponseErrorData> {
    constructor(message: string, data: AwsResponseErrorData, code: number = LSPErrorCodes.RequestFailed) {
        super(code, message, data)
        Object.setPrototypeOf(this, new.target.prototype)
    }
}

// listProfiles
export type ProfileKind = 'Unknown' | 'SsoTokenProfile' | 'IamCredentialProfile' | 'EmptyProfile'

export const ProfileKind = {
    SsoTokenProfile: 'SsoTokenProfile',
    IamCredentialProfile: 'IamCredentialProfile',
    EmptyProfile: 'EmptyProfile',
    Unknown: 'Unknown',
} as const

// Profile and Session use 'settings' property as namescope for their settings to avoid future
// name conflicts with 'kinds', 'name', and future properties as well as making some setting
// iteration operations easier.

export interface Profile {
    kinds: ProfileKind[]
    name: string
    settings?: {
        region?: string
        sso_session?: string
        aws_access_key_id?: string
        aws_secret_access_key?: string
        aws_session_token?: string
        role_arn?: string
    }
}

export interface SsoSession {
    name: string
    settings?: {
        sso_start_url?: string
        sso_region?: string
        sso_registration_scopes?: string[]
    }
}

export type ListProfilesParams = {
    // Intentionally left blank
}

export interface ListProfilesResult {
    profiles: Profile[]
    ssoSessions: SsoSession[]
}

// Potential error codes: E_UNKNOWN | E_TIMEOUT | E_RUNTIME_NOT_SUPPORTED | E_CANNOT_READ_SHARED_CONFIG
export const listProfilesRequestType = new ProtocolRequestType<
    ListProfilesParams,
    ListProfilesResult,
    never,
    AwsResponseError,
    void
>('aws/identity/listProfiles')

// updateProfile
export interface UpdateProfileOptions {
    createNonexistentProfile?: boolean
    createNonexistentSsoSession?: boolean
    updateSharedSsoSession?: boolean
}

export const updateProfileOptionsDefaults = {
    createNonexistentProfile: true,
    createNonexistentSsoSession: true,
    updateSharedSsoSession: false,
} satisfies UpdateProfileOptions

// To change a setting, pass the new value set on it.  To delete a setting, set it to null or undefined.
// Settings not provided are ignored, preserving the previous value, if any, in the shared config files.
export interface UpdateProfileParams {
    profile: Profile
    ssoSession?: SsoSession
    options?: UpdateProfileOptions
}

export interface UpdateProfileResult {
    // Intentionally left blank
}

// Potential error codes: E_UNKNOWN | E_TIMEOUT | E_RUNTIME_NOT_SUPPORTED | E_CANNOT_READ_SHARED_CONFIG
//   E_CANNOT_WRITE_SHARED_CONFIG | E_CANNOT_CREATE_PROFILE | E_CANNOT_OVERWRITE_PROFILE | E_CANNOT_CREATE_SSO_SESSION
//   E_CANNOT_OVERWRITE_SSO_SESSION | E_INVALID_PROFILE | E_INVALID_SSO_SESSION
export const updateProfileRequestType = new ProtocolRequestType<
    UpdateProfileParams,
    UpdateProfileResult,
    never,
    AwsResponseError,
    void
>('aws/identity/updateProfile')

// getSsoToken
export type CredentialId = string // Opaque identifier

export type IamIdentityCenterSsoTokenSourceKind = 'IamIdentityCenter'
export type AwsBuilderIdSsoTokenSourceKind = 'AwsBuilderId'

export type SsoTokenSourceKind = IamIdentityCenterSsoTokenSourceKind | AwsBuilderIdSsoTokenSourceKind

export const SsoTokenSourceKind = {
    IamIdentityCenter: 'IamIdentityCenter',
    AwsBuilderId: 'AwsBuilderId',
} as const

export interface AwsBuilderIdSsoTokenSource {
    kind: AwsBuilderIdSsoTokenSourceKind
    ssoRegistrationScopes: string[]
}

export interface IamIdentityCenterSsoTokenSource {
    kind: IamIdentityCenterSsoTokenSourceKind
    profileName: string
}

export type InProgress = 'InProgress'
export type Complete = 'Complete'

export type GetSsoTokenProgressState = InProgress | Complete

export const GetSsoTokenProgressState = {
    InProgress: 'InProgress',
    Complete: 'Complete',
} as const

export interface GetSsoTokenProgress {
    message?: string
    state: GetSsoTokenProgressState
}

export const GetSsoTokenProgressType = new ProgressType<GetSsoTokenProgress>()

// Use this to identify the sendProgress/onProgress call from the identity server.
// It indicates that an SSO login is currently in progress.
export const GetSsoTokenProgressToken = 'aws/identity/getSsoToken/progressToken'

export type DeviceCodeAuthorizationFlowKind = 'DeviceCode'
export type PkceAuthorizationFlowKind = 'Pkce'
export type AuthorizationFlowKind = DeviceCodeAuthorizationFlowKind | PkceAuthorizationFlowKind
export const AuthorizationFlowKind = {
    DeviceCode: 'DeviceCode',
    Pkce: 'Pkce',
} as const

export interface GetSsoTokenOptions {
    loginOnInvalidToken?: boolean
    authorizationFlow?: AuthorizationFlowKind // Unused if loginOnInvalidToken is false
}

export const getSsoTokenOptionsDefaults = {
    loginOnInvalidToken: true,
    authorizationFlow: AuthorizationFlowKind.Pkce,
} satisfies GetSsoTokenOptions

export interface GetSsoTokenParams {
    source: IamIdentityCenterSsoTokenSource | AwsBuilderIdSsoTokenSource
    clientName: string
    options?: GetSsoTokenOptions
}

export interface SsoToken {
    id: CredentialId
    accessToken: string // This field is encrypted with JWT like 'update'
    // Additional fields captured in token cache file may be added here in the future
}

export interface GetSsoTokenResult {
    ssoToken: SsoToken
    updateCredentialsParams: UpdateCredentialsParams
}

// Potential error codes: E_UNKNOWN | E_TIMEOUT | E_ENCRYPTION_REQUIRED | E_INVALID_TOKEN
export const getSsoTokenRequestType = new ProtocolRequestType<
    GetSsoTokenParams,
    GetSsoTokenResult,
    never,
    AwsResponseError,
    void
>('aws/identity/getSsoToken')

// getIamCredential
export interface GetIamCredentialOptions {
    generateOnInvalidStsCredential?: boolean
}

export const getIamCredentialOptionsDefaults = {
    generateOnInvalidStsCredential: true,
} satisfies GetIamCredentialOptions

export interface GetIamCredentialParams {
    profileName: string
    options?: GetIamCredentialOptions
}

export interface GetIamCredentialResult {
    id: CredentialId
    credentials: IamCredentials
    updateCredentialsParams: UpdateCredentialsParams
}

export const getIamCredentialRequestType = new ProtocolRequestType<
    GetIamCredentialParams,
    GetIamCredentialResult,
    never,
    AwsResponseError,
    void
>('aws/identity/getIamCredential')

// invalidateSsoToken
export interface InvalidateSsoTokenParams {
    ssoTokenId: CredentialId
}

export interface InvalidateSsoTokenResult {
    // Intentionally left blank
}

// Pontential error codes: E_UNKNOWN | E_TIMEOUT | E_CANNOT_READ_SSO_CACHE | E_CANNOT_WRITE_SSO_CACHE | E_INVALID_TOKEN
export const invalidateSsoTokenRequestType = new ProtocolRequestType<
    InvalidateSsoTokenParams,
    InvalidateSsoTokenResult,
    never,
    AwsResponseError,
    void
>('aws/identity/invalidateSsoToken')

export interface InvalidateIamCredentialParams {
    iamCredentialsId: CredentialId
}

export interface InvalidateIamCredentialResult {
    // Intentionally left blank
}

// Pontential error codes: E_UNKNOWN | E_TIMEOUT | E_CANNOT_READ_SSO_CACHE | E_CANNOT_WRITE_SSO_CACHE | E_INVALID_TOKEN
export const invalidateIamCredentialRequestType = new ProtocolRequestType<
    InvalidateIamCredentialParams,
    InvalidateIamCredentialResult,
    never,
    AwsResponseError,
    void
>('aws/identity/invalidateIamCredential')

// invalidateStsCredential
// export interface InvalidateStsCredentialParams {
//     stsCredentialId: CredentialId
// }

// export interface InvalidateStsCredentialResult {
//     // Intentionally left blank
// }

// export const invalidateStsCredentialRequestType = new ProtocolRequestType<
//     InvalidateStsCredentialParams,
//     InvalidateStsCredentialResult,
//     never,
//     AwsResponseError,
//     void
// >('aws/identity/invalidateStsCredential')

// ssoTokenChanged
export type Expired = 'Expired'
export type Refreshed = 'Refreshed'

export type SsoTokenChangedKind = Refreshed | Expired

export const SsoTokenChangedKind = {
    Expired: 'Expired',
    Refreshed: 'Refreshed',
} as const

export interface SsoTokenChangedParams {
    kind: SsoTokenChangedKind
    ssoTokenId: CredentialId
}

export const ssoTokenChangedRequestType = new ProtocolNotificationType<SsoTokenChangedParams, void>(
    'aws/identity/ssoTokenChanged'
)

// stsCredentialChanged
// export type StsCredentialChangedKind = Refreshed | Expired

// export const StsCredentialChangedKind = {
//     Expired: 'Expired',
//     Refreshed: 'Refreshed',
// } as const

// export interface StsCredentialChangedParams {
//     kind: StsCredentialChangedKind
//     stsCredentialId: CredentialId
// }

// export const stsCredentialChangedRequestType = new ProtocolNotificationType<StsCredentialChangedParams, void>(
//     'aws/identity/stsCredentialChanged'
// )
