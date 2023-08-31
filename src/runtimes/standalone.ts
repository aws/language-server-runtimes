import { InitializeParams, TextDocumentSyncKind, TextDocuments } from "vscode-languageserver"
import { TextDocument } from 'vscode-languageserver-textdocument'
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node'
import { Auth, Logging, Lsp, Telemetry, Workspace } from '../features'
import { inlineCompletionRequestType } from "../features/lsp/inline-completions/futureProtocol"
import { metric } from '../features/telemetry'
import { Server } from './server'

type Handler<A = any[], B = any> = (...args: A extends any[] ? A : [A]) => B
type HandlerWrapper<H extends Handler, A extends Parameters<H>, B extends ReturnType<H>> = (name: string, handler: H) => (...args: A) => B

// Instruments a handler to emit telemetry without changing its signature. Supports async handlers.
// Tracks timing between invocation and completion of the handler, and emits a failure count (either 0 or 1)
// depending on whether the handler threw an error or not.
const withTelemetry = <H extends Handler, A extends Parameters<H>, B extends ReturnType<H>>(telemetry: Telemetry) => (name: string, handler: H) => (...args: A): B => {
    const startTime = new Date().valueOf()
    const result = handler(...args)
    Promise.resolve(result)
        .finally(() => telemetry.emit(metric(`${name}Time`, new Date().valueOf() - startTime)))
        .then(() => telemetry.emit(metric(`${name}Error`, 0)))
        .catch(() => telemetry.emit(metric(`${name}Error`, 1)))
    return result
}

// Instruments a handler to emit logging on invocation without changing its signature.
const withLogging = <H extends Handler, A extends Parameters<H>, B extends ReturnType<H>>(logging: Logging) => (name: string, handler: H) => (...args: A): B => {
    logging.log(`[${name}] was called`)
    return handler(...args)
}

/**
 * The runtime for standalone LSP-based servers.
 * 
 * Initializes one or more Servers with the following features:
 * - Auth: No-op auth
 * - LSP: Initializes a connection based on STDIN / STDOUT
 * - Logging: logs messages through the LSP connection
 * - Telemetry: emits telemetry through the LSP connection
 * - Workspace: tracks open and closed files from the LSP connection
 * 
 * By instantiating features inside the runtime we can tree-shake features or
 * variants of features in cases where they are not used.
 * 
 * E.g., we can have separate implementations for a standalone and web
 * without increasing the bundle size for either. We can also depend on
 * platform specific features like STDIN/STDOUT that might not be available
 * in other runtimes.
 * 
 * As features are implemented, e.g., Auth or Telemetry, they will be supported
 * by each runtime.
 * 
 * @param servers The list of servers to initialize and run
 * @returns 
 */
export const standalone = (...servers: Server[]) => {
    const lspConnection = createConnection(ProposedFeatures.all)
    const documents = new TextDocuments(TextDocument)

    // Initialize the LSP connection based on the supported LSP capabilities
    // TODO: make this dependent on the actual requirements of the
    // servers parameter.
    lspConnection.onInitialize((params: InitializeParams) => {
        return {
            serverInfo: {
                // TODO: make this configurable
                name: "AWS LSP Standalone",
                // This indicates the standalone server version and is updated
                // every time the standalone or any of the servers update.
                // Major version updates only happen when the supported LSP
                // protocol version changes and is not backwards compatible.
                // TODO: Set this at build time to match the above description
                version: "0.1",
            },
            capabilities: {
                textDocumentSync: {
                    openClose: true,
                    change: TextDocumentSyncKind.Incremental,
                },
                completionProvider: {
                    resolveProvider: true,
                    completionItem: {
                        labelDetailsSupport: true,
                    },
                },
            },
        }
    })

    // Set up logigng over LSP
    // TODO: set up Logging once implemented
    const logging: Logging = {
        log: message => lspConnection.console.info(`[${new Date().toISOString()}] ${message}`)
    }

    // Set up telemetry over LSP
    // TODO: set up Telemetry once implemented
    const telemetry: Telemetry = {
        emit: metric => lspConnection.telemetry.logEvent(metric)
    }

    // TODO: This can probably be cleaned up a bit more.
    // This type ensures that the signature of the handler function does not change, even if we instrument it with telemetry or logging
    const withLspTelemetry: <H extends Handler, A extends Parameters<H>, B extends ReturnType<H>>(name: string, handler: H) => (...args: A) => B = withTelemetry(telemetry)
    const withLspLogging: <H extends Handler, A extends Parameters<H>, B extends ReturnType<H>>(name: string, handler: H) => (...args: A) => B = withLogging(logging)
    const instrument: <H extends Handler, A extends Parameters<H>, B extends ReturnType<H>>(name: string, handler: H) => (...args: A) => B = (name: string, handler: any) => withLspLogging(name, withLspTelemetry(name, handler))

    // Set up the workspace sync to use the LSP Text Document Sync capability
    const workspace: Workspace = {
        getTextDocument: instrument("getTextDocument", async uri => documents.get(uri))
    }

    // Map the instrumented LSP client to the LSP feature.
    const lsp: Lsp = {
        onCompletion: handler => lspConnection.onCompletion(instrument("onCompletion", handler)),
        onInlineCompletion: handler => lspConnection.onRequest(inlineCompletionRequestType, instrument("onInlineCompletion", handler))
    }

    // Set up no-op Auth
    // TODO: set up Auth once implemented
    const auth: Auth = {
        hasCredentials: () => false,
        getCredentials: () => undefined,
    }

    // Initialize every Server
    const disposables = servers.map(s => s({ auth, lsp, workspace, telemetry, logging }))

    // Free up any resources or threads used by Servers
    lspConnection.onExit(() => {
        disposables.forEach(d => d())
    })

    // Initialize the documents listener and start the LSP connection
    documents.listen(lspConnection)
    lspConnection.listen()
}