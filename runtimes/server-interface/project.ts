import {
    RequestHandler,
    QueryInlineProjectContextParams,
    QueryInlineProjectContextResult,
    QueryVectorIndexParams,
    QueryVectorIndexResult,
} from '../protocol'

export type Project = {
    onQueryVectorIndex: (handler: RequestHandler<QueryVectorIndexParams, QueryVectorIndexResult, void>) => void
    onQueryInlineProjectContext: (
        handler: RequestHandler<QueryInlineProjectContextParams, QueryInlineProjectContextResult, void>
    ) => void
}
