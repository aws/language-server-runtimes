import { ProtocolRequestType, ProtocolNotificationType0, ProtocolRequestType0 } from './lsp'

export type IamCredentials = {
    readonly accessKeyId: string
    readonly secretAccessKey: string
    readonly sessionToken?: string
}

export type BearerCredentials = {
    readonly token: string
}

export interface SsoProfileData {
    startUrl?: string
}

export interface ConnectionMetadata {
    sso?: SsoProfileData
}

export interface UpdateCredentialsParams {
    // Plaintext Credentials (for browser based environments) or encrypted JWT token
    data: IamCredentials | BearerCredentials | string
    // If the payload is encrypted
    // Defaults to false if undefined or null
    encrypted?: boolean
}

export const iamCredentialsUpdateRequestType = new ProtocolRequestType<UpdateCredentialsParams, null, void, void, void>(
    'aws/credentials/iam/update'
)

export const iamCredentialsDeleteNotificationType = new ProtocolNotificationType0<void>('aws/credentials/iam/delete')

export const bearerCredentialsUpdateRequestType = new ProtocolRequestType<
    UpdateCredentialsParams,
    null,
    void,
    void,
    void
>('aws/credentials/token/update')

export const bearerCredentialsDeleteNotificationType = new ProtocolNotificationType0<void>(
    'aws/credentials/token/delete'
)

export const getConnectionMetadataRequestType = new ProtocolRequestType0<ConnectionMetadata, never, void, void>(
    'aws/credentials/getConnectionMetadata'
)
