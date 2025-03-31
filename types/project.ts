export type ChunkId = string

export type FaissIndex = number

export interface InlineProjectContext {
    content: string
    filePath: string
    score: number
}

export interface Chunk {
    readonly filePath: string
    relativePath?: string
    content: string
    readonly id: ChunkId
    index: FaissIndex
    vec: number[]
    context?: string
    prev?: ChunkId
    next?: ChunkId
    programmingLanguage?: string
    startLine?: number
    endLine?: number
}

export interface QueryVectorIndexParams {
    query: string
}

export interface QueryVectorIndexResult {
    chunks: Chunk[]
}

export interface QueryInlineProjectContextParams {
    query: string
    filePath: string
    target?: string
}

export interface QueryInlineProjectContextResult {
    inlineProjectContext: InlineProjectContext[]
}
