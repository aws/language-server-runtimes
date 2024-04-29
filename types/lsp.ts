export type { TextDocument } from 'vscode-languageserver-textdocument'

export * from 'vscode-languageserver-types'

export interface PartialResultParams {
    /**
     * An optional token that a server can use to report partial results (e.g.
     * streaming) to the client.
     */
    partialResultToken?: number | string
}
