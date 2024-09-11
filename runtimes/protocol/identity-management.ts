import { ProtocolNotificationType, ProtocolRequestType } from './lsp'

export type E_UNKNOWN = 'E_UNKNOWN'
export type E_TIMEOUT = 'E_TIMEOUT'
export type E_RUNTIME_NOT_SUPPORTED = 'E_RUNTIME_NOT_SUPPORTED'
export type E_ENCRYPTION_REQUIRED = 'E_ENCRYPTION_REQUIRED'
export type E_CANNOT_READ_SHARED_CONFIG = 'E_CANNOT_READ_SHARED_CONFIG'
export type E_CANNOT_WRITE_SHARED_CONFIG = 'E_CANNOT_WRITE_SHARED_CONFIG'
export type E_CANNOT_READ_SSO_CACHE = 'E_CANNOT_READ_SSO_CACHE'
export type E_CANNOT_WRITE_SSO_CACHE = 'E_CANNOT_WRITE_SSO_CACHE'
export type E_PROFILE_NOT_FOUND = 'E_PROFILE_NOT_FOUND'
export type E_CANNOT_OVERWRITE_PROFILE = 'E_CANNOT_OVERWRITE_PROFILE'
export type E_INVALID_PROFILE = 'E_INVALID_PROFILE'
export type E_SSO_SESSION_NOT_FOUND = 'E_SSO_SESSION_NOT_FOUND'
export type E_CANNOT_OVERWRITE_SSO_SESSION = 'E_CANNOT_OVERWRITE_SSO_SESSION'
export type E_INVALID_SSO_SESSION = 'E_INVALID_SSO_SESSION'
export type E_INVALID_TOKEN = 'E_INVALID_TOKEN'

export type ListProfilesParams = {}
export type SsoTokenProfileKind = 'SsoToken'

export type ProfileKind = SsoTokenProfileKind

export const ProfileKind = {
    SsoToken: 'SsoToken',
} as const

export interface Section {
    name: string
}

export interface Profile extends Section {
    readonly kind: ProfileKind
    region?: string
}

export interface SsoTokenProfile extends Profile {
    readonly kind: SsoTokenProfileKind
    ssoSessionName: string
}

export interface SsoSession extends Section {
    ssoStartUrl: string
    ssoRegion: string
    ssoRegistrationScopes?: string[]
}

export interface ListProfilesResult {
    profiles?: (Profile | SsoTokenProfile)[]
    ssoSessions?: SsoSession[]
}
export interface ListProfilesError {
    errorCode: E_UNKNOWN | E_TIMEOUT | E_RUNTIME_NOT_SUPPORTED | E_CANNOT_READ_SHARED_CONFIG
}
export const listProfilesRequestType = new ProtocolRequestType<
    ListProfilesParams,
    ListProfilesResult,
    never,
    ListProfilesError,
    void
>('aws/identity/listProfiles')

// updateProfile
export interface UpdateProfileOptions {
    createNonexistentProfile?: boolean // default is true
    createNonexistentSsoSession?: boolean // default is true
    updateSharedSsoSession?: boolean // default is false
}

export interface UpdateProfileParams {
    profile: SsoTokenProfile // | OtherProfile types may be supported in the future
    ssoSession?: SsoSession
    options?: UpdateProfileOptions
}

export interface UpdateProfileResult {
    // Intentionally left blank
}
export interface UpdateProfileError {
    errorCode:
        | E_UNKNOWN
        | E_TIMEOUT
        | E_RUNTIME_NOT_SUPPORTED
        | E_CANNOT_READ_SHARED_CONFIG
        | E_CANNOT_WRITE_SHARED_CONFIG
        | E_CANNOT_OVERWRITE_PROFILE
        | E_CANNOT_OVERWRITE_SSO_SESSION
        | E_INVALID_PROFILE
        | E_INVALID_SSO_SESSION
}

export const updateProfilesRequestType = new ProtocolRequestType<
    UpdateProfileParams,
    UpdateProfileResult,
    never,
    UpdateProfileError,
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

export interface GetSsoTokenError {
    errorCode: E_UNKNOWN | E_TIMEOUT | E_ENCRYPTION_REQUIRED | E_INVALID_TOKEN
}

export const getSsoTokenRequestType = new ProtocolRequestType<
    GetSsoTokenParams,
    GetSsoTokenResult,
    never,
    GetSsoTokenError,
    void
>('aws/identity/getSsoToken')

// invalidateSsoToken
export interface InvalidateSsoTokenParams {
    readonly ssoTokenId: SsoTokenId
}

export interface InvalidateSsoTokenResult {
    // Intentionally left blank
}

export interface InvalidateSsoTokenError {
    errorCode: E_UNKNOWN | E_TIMEOUT | E_CANNOT_READ_SSO_CACHE | E_CANNOT_WRITE_SSO_CACHE | E_INVALID_TOKEN
}

export const invalidateSsoTokenRequestType = new ProtocolRequestType<
    InvalidateSsoTokenParams,
    InvalidateSsoTokenResult,
    never,
    InvalidateSsoTokenError,
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

export interface UpdateSsoTokenManagementError {
    errorCode: E_UNKNOWN | E_TIMEOUT | E_INVALID_TOKEN
}

export const updateSsoTokenManagementRequestType = new ProtocolRequestType<
    UpdateSsoTokenManagementParams,
    UpdateSsoTokenManagementResult,
    never,
    UpdateSsoTokenManagementError,
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
