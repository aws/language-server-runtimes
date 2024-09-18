import { ProtocolRequestType } from './lsp'

export const getConfigurationFromServerRequestType = new ProtocolRequestType<
    GetConfigurationFromServerParams,
    any[],
    never,
    void,
    void
>('aws/getConfigurationFromServer')

export interface GetConfigurationFromServerParams {
    scopes: string[] | string
}
