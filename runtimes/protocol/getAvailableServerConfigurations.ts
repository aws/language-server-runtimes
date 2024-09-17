import { ProtocolRequestType } from './lsp'

export const getConfigurationFromServerRequestType = new ProtocolRequestType<
    GetConfigurationFromServerParams,
    any[],
    never,
    void,
    void
>('aws/getConfigurationFromServer')

export interface GetConfigurationFromServerParams {
    items: ServerConfiguration[]
}

export interface ServerConfiguration {
    /**
     * The scope to get the configuration section for.
     */
    scopeUri?: string

    /**
     * The configuration section asked for.
     */
    section?: string
}
