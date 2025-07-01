import { IamCredentials, BearerCredentials, ConnectionMetadata } from '../protocol'

// Exports for Capability implementor
export { IamCredentials, BearerCredentials, ConnectionMetadata }

export type CredentialsType = 'iam' | 'bearer' | undefined
export type Credentials = IamCredentials | BearerCredentials
export type SsoConnectionType = 'builderId' | 'identityCenter' | 'none'

// Helper functions for credential type detection
export function hasStsProperties(credentials: IamCredentials): boolean {
    return credentials.sessionToken !== undefined && credentials.expiration !== undefined
}

export function isExpiredCredentials(credentials: IamCredentials): boolean {
    if (!credentials.expiration) return false
    return Date.now() >= credentials.expiration.getTime()
}

export interface CredentialsProvider {
    hasCredentials: () => boolean
    getCredentials: () => Credentials | undefined
    getCredentialsType: () => CredentialsType | undefined
    getConnectionMetadata: () => ConnectionMetadata | undefined
    getConnectionType: () => SsoConnectionType
    onCredentialsDeleted: (handler: (type: CredentialsType) => void) => void
}
