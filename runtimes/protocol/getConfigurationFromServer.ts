import { LSPAny, ProtocolRequestType } from './lsp'

export const getConfigurationFromServerRequestType = new ProtocolRequestType<
    GetConfigurationFromServerParams,
    LSPAny,
    never,
    void,
    void
>('aws/getConfigurationFromServer')

export interface GetConfigurationFromServerParams {
    section: string
}
