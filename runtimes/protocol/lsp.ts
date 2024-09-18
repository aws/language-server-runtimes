import { _EM } from 'vscode-jsonrpc'
import {
    InitializeParams as _InitializeParamsBase,
    InitializeResult as _InitializeResultBase,
    ParameterStructures,
    ProgressType,
    RegistrationType,
    RequestType,
} from 'vscode-languageserver-protocol'
import { ChatOptions } from '@aws/language-server-runtimes-types'

export * from '@aws/language-server-runtimes-types'
export { TextDocument } from 'vscode-languageserver-textdocument'

// LSP protocol is a core dependency for LSP feature provided by runtimes.
// Since we aim to provide whole range of LSP specification for Clients and Capabilities,
// we re-exporting whole LSP protocol for usage.
// Scoping it down is not practical due to large surface of protocol and types relationship.
// It will be limiting implementors, if they choose to type their code with more specific types from LSP.
export * from 'vscode-languageserver-protocol'

// Custom Runtimes LSP extensions
export * from './getConfigurationFromServer'
export * from './inlineCompletionWithReferences'
export * from './inlineCompletions'

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

/**
 * Extended Client information, passed from client extension to server at initialization.
 * Use to pass additional information about Client Extension, which connects to Language Server,
 * when information in default LSP request is not enough.
 */
export interface ExtendedClientInfo {
    /**
     * Client environment name. May represent IDE or host platform of the Extension.
     */
    name: string

    /**
     * Client environment version.
     */
    version: string

    /**
     * Information about Client Extension passed during initialization from Client to Server.
     * Use to identify extension and pass additional data, not available in standard InitializeParams object.
     */
    extension: {
        /**
         * Client Extension name, which is used for managing and interacting with AWS Language Server.
         * May contain spaces.
         */
        name: string

        /**
         * Client extension version.
         */
        version: string
    }

    /**
     * Unique client Id, defined by the client extension.
     */
    clientId?: string
}

export interface AWSInitializationOptions {
    /**
     * Additional clientInfo to extend or override default data passed by LSP Client.
     */
    clientInfo?: ExtendedClientInfo
}

/**
 * Extended AWS Runtimes InitializeParams interface,
 * sent from Client to Server as part of [`initialize`](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#initialize) request
 */
export interface InitializeParams extends _InitializeParamsBase {
    initializationOptions?: {
        [key: string]: any
        aws: AWSInitializationOptions
    }
}

/**
 * Custom AWS Runtimes InitializeResult object interface with extended options.
 */
export interface InitializeResult extends _InitializeResultBase {
    /**
     * The server signals custom AWS Runtimes capabilities it supports.
     */
    awsServerCapabilities?: {
        chatOptions?: ChatOptions
        configurationProvider?: ConfigurationOptions
    }
}

/**
 * Configuration options for AWS Runtimes
 * Sent back to the client to signal available configuration values
 */
export interface ConfigurationOptions {
    sections: string[]
}
