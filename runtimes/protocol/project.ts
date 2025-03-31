import {
    QueryInlineProjectContextParams,
    QueryInlineProjectContextResult,
    QueryVectorIndexParams,
    QueryVectorIndexResult,
    ProtocolRequestType,
} from './lsp'

export const queryInlineProjectContextRequestType = new ProtocolRequestType<
    QueryInlineProjectContextParams,
    QueryInlineProjectContextResult,
    never,
    void,
    void
>('aws/project/inlineProjectContext')

export const queryVectorIndexRequestType = new ProtocolRequestType<
    QueryVectorIndexParams,
    QueryVectorIndexResult,
    never,
    void,
    void
>('aws/project/index')
