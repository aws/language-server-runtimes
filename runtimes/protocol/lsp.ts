import { ParameterStructures, ProgressType, RegistrationType, RequestType } from 'vscode-languageserver-protocol'
import { _EM } from 'vscode-jsonrpc'

export * from '@aws/language-server-runtimes-types'
export { TextDocument } from 'vscode-languageserver-textdocument'

// LSP protocol is a core dependency for LSP feature provided by runtimes.
// Since we aim to provide whole range of LSP specification for Clients and Capabilities,
// we re-exporting whole LSP protocol for usage.
// Scoping it down is not practical due to large surface of protocol and types relationship.
// It will be limiting implementors, if they choose to type their code with more specific types from LSP.
export * from 'vscode-languageserver-protocol'

// Custom Runtimes LSP extensions
export * from './inlineCompletions'
export * from './inlineCompletionWithReferences'

// AutoParameterStructuresProtocolRequestType allows ParameterStructures both by-name and by-position
export class AutoParameterStructuresProtocolRequestType<P, R, PR, E, RO>
    extends RequestType<P, R, E>
    implements ProgressType<PR>, RegistrationType<RO>
{
    /**
     * Clients must not use this property. It is here to ensure correct typing.
     */
    public readonly __: [PR, _EM] | undefined
    public readonly ___: [PR, RO, _EM] | undefined
    public readonly ____: [RO, _EM] | undefined
    public readonly _pr: PR | undefined

    public constructor(method: string) {
        super(method, ParameterStructures.auto)
    }
}
