import { LSPErrorCodes, ProtocolNotificationType, ProtocolRequestType, ResponseError } from './lsp'

// Errors
export const AwsErrorCodes = {
    E_UNKNOWN: 'E_UNKNOWN',
    E_TIMEOUT: 'E_TIMEOUT',
    E_RUNTIME_NOT_SUPPORTED: 'E_RUNTIME_NOT_SUPPORTED',
    E_ENCRYPTION_REQUIRED: 'E_ENCRYPTION_REQUIRED',
    E_CANNOT_READ_SHARED_CONFIG: 'E_CANNOT_READ_SHARED_CONFIG',
    E_CANNOT_WRITE_SHARED_CONFIG: 'E_CANNOT_WRITE_SHARED_CONFIG',
    E_CANNOT_READ_SSO_CACHE: 'E_CANNOT_READ_SSO_CACHE',
    E_CANNOT_WRITE_SSO_CACHE: 'E_CANNOT_WRITE_SSO_CACHE',
    E_PROFILE_NOT_FOUND: 'E_PROFILE_NOT_FOUND',
    E_CANNOT_CREATE_PROFILE: 'E_CANNOT_CREATE_PROFILE',
    E_CANNOT_OVERWRITE_PROFILE: 'E_CANNOT_OVERWRITE_PROFILE',
    E_INVALID_PROFILE: 'E_INVALID_PROFILE',
    E_SSO_SESSION_NOT_FOUND: 'E_SSO_SESSION_NOT_FOUND',
    E_CANNOT_CREATE_SSO_SESSION: 'E_CANNOT_CREATE_SSO_SESSION',
    E_CANNOT_OVERWRITE_SSO_SESSION: 'E_CANNOT_OVERWRITE_SSO_SESSION',
    E_INVALID_SSO_SESSION: 'E_INVALID_SSO_SESSION',
    E_INVALID_TOKEN: 'E_INVALID_TOKEN',
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
export type ProfileKind = 'Unknown' | 'SsoTokenProfile'

export const ProfileKind = {
    SsoTokenProfile: 'SsoTokenProfile',
    Unknown: 'Unknown',
} as const

// Profile and SsoSession use 'settings' property as namescope for their settings to avoid future
// name conflicts with 'kinds', 'name', and future properties as well as making some setting
// iteration operations easier.

export interface Profile {
    kinds: ProfileKind[]
    name: string
    settings?: {
        region?: string
        sso_session?: string
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
    ensureSsoAccountAccessScope?: boolean
    updateSharedSsoSession?: boolean
}

export const updateProfileOptionsDefaults = {
    createNonexistentProfile: true,
    createNonexistentSsoSession: true,
    ensureSsoAccountAccessScope: true,
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
export type SsoTokenId = string // Opaque identifier

export type IamIdentityCenterSsoTokenSourceKind = 'IamIdentityCenter'
export type AwsBuilderIdSsoTokenSourceKind = 'AwsBuilderId'

export type SsoTokenSourceKind = IamIdentityCenterSsoTokenSourceKind | AwsBuilderIdSsoTokenSourceKind

export const SsoTokenSourceKind = {
    IamIdentityCenter: 'IamIdentityCenter',
    AwsBuilderId: 'AwsBuilderId',
} as const

export interface AwsBuilderIdSsoTokenSource {
    readonly kind: AwsBuilderIdSsoTokenSourceKind
    clientName: string
}

export interface IamIdentityCenterSsoTokenSource {
    readonly kind: IamIdentityCenterSsoTokenSourceKind
    clientName: string
    issuerUrl: string
    region: string
}

export interface GetSsoTokenOptions {
    autoRefresh?: boolean // default is true
    changeNotifications?: boolean // default is true
    loginOnInvalidToken?: boolean // default is true
}

export interface GetSsoTokenParams {
    source: IamIdentityCenterSsoTokenSource | AwsBuilderIdSsoTokenSource
    scopes?: string[]
    options?: GetSsoTokenOptions
}

export interface SsoToken {
    readonly id: SsoTokenId
    readonly accessToken: string // This field is encrypted with JWT like 'update'
    // Additional fields captured in token cache file may be added here in the future
}

export interface GetSsoTokenResult {
    ssoToken: SsoToken
}

// Potential error codes: E_UNKNOWN | E_TIMEOUT | E_ENCRYPTION_REQUIRED | E_INVALID_TOKEN
export const getSsoTokenRequestType = new ProtocolRequestType<
    GetSsoTokenParams,
    GetSsoTokenResult,
    never,
    AwsResponseError,
    void
>('aws/identity/getSsoToken')

// invalidateSsoToken
export interface InvalidateSsoTokenParams {
    readonly ssoTokenId: SsoTokenId
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

// updateSsoTokenManagement
export interface UpdateSsoTokenManagementParams {
    readonly ssoTokenId: SsoTokenId
    autoRefresh?: boolean // no change if not set
    changeNotifications?: boolean // no change if not set
}

export interface UpdateSsoTokenManagementResult {
    readonly ssoTokenId: SsoTokenId // same as supplied request params value
    readonly autoRefresh: boolean // returns state after call
    readonly changeNotifications: boolean // returns state after call
}

// Potential error codes: E_UNKNOWN | E_TIMEOUT | E_INVALID_TOKEN
export const updateSsoTokenManagementRequestType = new ProtocolRequestType<
    UpdateSsoTokenManagementParams,
    UpdateSsoTokenManagementResult,
    never,
    AwsResponseError,
    void
>('aws/identity/updateSsoTokenManagement')

// ssoTokenChanged
export type Created = 'Created'
export type Refreshed = 'Refreshed'
export type Expired = 'Expired'
export type Invalidated = 'Invalidated'

export type SsoTokenChangedKind = Created | Refreshed | Expired | Invalidated

export const SsoTokenChangedKind = {
    Created: 'Created',
    Refreshed: 'Refreshed',
    Expired: 'Expired',
    Invalidated: 'Invalidated',
} as const

export interface SsoTokenChangedParams {
    readonly kind: SsoTokenChangedKind
    readonly ssoTokenId: SsoTokenId
}

export const ssoTokenChangedRequestType = new ProtocolNotificationType<SsoTokenChangedParams, void>(
    'aws/identity/ssoTokenChanged'
)
