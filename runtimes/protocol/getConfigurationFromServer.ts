import { AutoParameterStructuresProtocolRequestType, LSPAny } from './lsp'

export const getConfigurationFromServerRequestType = new AutoParameterStructuresProtocolRequestType<
    GetConfigurationFromServerParams,
    LSPAny,
    never,
    void,
    void
>('aws/getConfigurationFromServer')

export interface GetConfigurationFromServerParams {
    section: string
}
