import { IamCredentials, BearerCredentials, ConnectionMetadata } from '../protocol'

// Exports for Capability implementor
export { IamCredentials, BearerCredentials, ConnectionMetadata }

export type CredentialsType = 'iam' | 'bearer'
export type Credentials = IamCredentials | BearerCredentials

export interface CredentialsProvider {
    hasCredentials: (type: CredentialsType) => boolean
    getCredentials: (type: CredentialsType) => Credentials | undefined
    getConnectionMetadata?: () => ConnectionMetadata | undefined
}
