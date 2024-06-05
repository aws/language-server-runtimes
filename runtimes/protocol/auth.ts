import {
    AutoParameterStructuresProtocolRequestType,
    ConnectionMetadata,
    ProtocolNotificationType0,
    ProtocolRequestType0,
    UpdateCredentialsParams,
} from './lsp'

export const iamCredentialsUpdateRequestType = new AutoParameterStructuresProtocolRequestType<
    UpdateCredentialsParams,
    null,
    void,
    void,
    void
>('aws/credentials/iam/update')

export const iamCredentialsDeleteNotificationType = new ProtocolNotificationType0<void>('aws/credentials/iam/delete')

export const bearerCredentialsUpdateRequestType = new AutoParameterStructuresProtocolRequestType<
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
