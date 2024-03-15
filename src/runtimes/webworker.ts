import {
    DidChangeConfigurationNotification,
    PublishDiagnosticsNotification,
    TextDocuments,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser'
import { Logging, Lsp, Telemetry, Workspace } from '../features'
import { inlineCompletionRequestType } from '../features/lsp/inline-completions/futureProtocol'
import { Auth } from '../features/auth/auth'

import { RuntimeProps } from './runtime'
import {
    inlineCompletionWithReferencesRequestType,
    logInlineCompletionSessionResultsNotificationType,
} from '../features/lsp/inline-completions/protocolExtensions'
import { observe } from '../features/lsp'
import { InitializeHandler } from './initialize'

declare const self: WindowOrWorkerGlobalScope

// TODO: testing rig for runtimes
export const webworker = (props: RuntimeProps) => {
    const lspConnection = createConnection(new BrowserMessageReader(self), new BrowserMessageWriter(self))

    const documentsObserver = observe(lspConnection)
    const documents = new TextDocuments(TextDocument)

    let initializeHandler = new InitializeHandler(props.name, props.version)
    lspConnection.onInitialize(initializeHandler.onInitialize)

    // Set up logigng over LSP
    const logging: Logging = {
        log: message => lspConnection.console.info(`[${new Date().toISOString()}] ${message}`),
    }

    // Set up telemetry over LSP
    const telemetry: Telemetry = {
        emitMetric: metric => lspConnection.telemetry.logEvent(metric),
    }

    // Set up the workspace to use the LSP Text Documents component
    const workspace: Workspace = {
        getTextDocument: async uri => documents.get(uri),
        getWorkspaceFolder: _uri =>
            initializeHandler.clientInitializeParams!.workspaceFolders &&
            initializeHandler.clientInitializeParams!.workspaceFolders[0],
        fs: {
            copy: (_src, _dest) => Promise.resolve(),
            exists: _path => Promise.resolve(false),
            getFileSize: _path => Promise.resolve({ size: 0 }),
            getTempDirPath: () => '/tmp',
            readFile: _path => Promise.resolve(''),
            readdir: _path => Promise.resolve([]),
            isFile: _path => Promise.resolve(false),
            remove: _dir => Promise.resolve(),
        },
    }

    // Map the LSP client to the LSP feature.
    const lsp: Lsp = {
        addInitializer: initializeHandler.addHandler,
        onInitialized: handler =>
            lspConnection.onInitialized(p => {
                const workspaceCapabilities = initializeHandler.clientInitializeParams?.capabilities.workspace
                if (workspaceCapabilities?.didChangeConfiguration?.dynamicRegistration) {
                    // Ask the client to notify the server on configuration changes
                    lspConnection.client.register(DidChangeConfigurationNotification.type, undefined)
                }
                handler(p)
            }),
        onCompletion: handler => lspConnection.onCompletion(handler),
        onInlineCompletion: handler => lspConnection.onRequest(inlineCompletionRequestType, handler),
        didChangeConfiguration: handler => lspConnection.onDidChangeConfiguration(handler),
        onDidChangeTextDocument: handler => documentsObserver.callbacks.onDidChangeTextDocument(handler),
        onDidCloseTextDocument: handler => lspConnection.onDidCloseTextDocument(handler),
        onExecuteCommand: handler => lspConnection.onExecuteCommand(handler),
        workspace: {
            getConfiguration: section => lspConnection.workspace.getConfiguration(section),
        },
        publishDiagnostics: params => lspConnection.sendNotification(PublishDiagnosticsNotification.method, params),
        onHover: handler => lspConnection.onHover(handler),
        extensions: {
            onInlineCompletionWithReferences: handler =>
                lspConnection.onRequest(inlineCompletionWithReferencesRequestType, handler),
            onLogInlineCompletionSessionResults: handler => {
                lspConnection.onNotification(logInlineCompletionSessionResultsNotificationType, handler)
            },
        },
    }

    // Set up auth without encryption
    const auth = new Auth(lspConnection)
    const credentialsProvider = auth.getCredentialsProvider()

    // Initialize every Server
    const disposables = props.servers.map(s => s({ credentialsProvider, lsp, workspace, telemetry, logging }))

    // Free up any resources or threads used by Servers
    lspConnection.onExit(() => {
        disposables.forEach(d => d())
    })

    // Initialize the documents listener and start the LSP connection
    documents.listen(documentsObserver.callbacks)
    lspConnection.listen()
}
