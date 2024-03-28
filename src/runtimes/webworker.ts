import { TextDocuments } from 'vscode-languageserver'
import {
    DidChangeConfigurationNotification,
    ProgressToken,
    ProgressType,
    PublishDiagnosticsNotification,
    inlineCompletionWithReferencesRequestType,
    logInlineCompletionSessionResultsNotificationType,
    inlineCompletionRequestType,
    TextDocument,

    // Chat protocol
    chatRequestType,
    endChatRequestType,
    quickActionRequestType,
    followUpClickNotificationType,
    sourceLinkClickNotificationType,
    infoLinkClickNotificationType,
    linkClickNotificationType,
    copyCodeToClipboardNotificationType,
    insertToCursorPositionNotificationType,
    feedbackNotificationType,
    voteNotificationType,
    readyNotificationType,
    tabChangeNotificationType,
    tabAddNotificationType,
    tabRemoveNotificationType,
} from '../protocol'
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser'
import { Chat, Logging, Lsp, Telemetry, Workspace } from '../server-interface'
import { Auth } from './auth'

import { RuntimeProps } from './runtime'

import { observe } from './lsp'
import { LspRouter } from './lsp/router/lspRouter'
import { LspServer } from './lsp/router/lspServer'

declare const self: WindowOrWorkerGlobalScope

// TODO: testing rig for runtimes
export const webworker = (props: RuntimeProps) => {
    const lspConnection = createConnection(new BrowserMessageReader(self), new BrowserMessageWriter(self))

    const documentsObserver = observe(lspConnection)
    const documents = new TextDocuments(TextDocument)

    // Create router that will be routing LSP events from the client to server(s)
    const lspRouter = new LspRouter(lspConnection, props.name, props.version)

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
            lspRouter.clientInitializeParams!.workspaceFolders && lspRouter.clientInitializeParams!.workspaceFolders[0],
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

    const chat: Chat = {
        onChatPrompt: handler => lspConnection.onRequest(chatRequestType.method, handler),
        onEndChat: handler => lspConnection.onRequest(endChatRequestType, handler),
        onQuickAction: handler => lspConnection.onRequest(quickActionRequestType, handler),
        onSendFeedback: handler => lspConnection.onNotification(feedbackNotificationType.method, handler),
        onReady: handler => lspConnection.onNotification(readyNotificationType.method, handler),
        onTabAdd: handler => lspConnection.onNotification(tabAddNotificationType.method, handler),
        onTabChange: handler => lspConnection.onNotification(tabChangeNotificationType.method, handler),
        onTabRemove: handler => lspConnection.onNotification(tabRemoveNotificationType.method, handler),
        onVote: handler => lspConnection.onNotification(voteNotificationType.method, handler),
        onCodeInsertToCursorPosition: handler =>
            lspConnection.onNotification(insertToCursorPositionNotificationType.method, handler),
        onCopyCodeToClipboard: handler =>
            lspConnection.onNotification(copyCodeToClipboardNotificationType.method, handler),
        onLinkClick: handler => lspConnection.onNotification(linkClickNotificationType.method, handler),
        onInfoLinkClick: handler => lspConnection.onNotification(infoLinkClickNotificationType.method, handler),
        onSourceLinkClick: handler => lspConnection.onNotification(sourceLinkClickNotificationType.method, handler),
        onFollowUpClicked: handler => lspConnection.onNotification(followUpClickNotificationType.method, handler),
    }

    // Set up auth without encryption
    const auth = new Auth(lspConnection)
    const credentialsProvider = auth.getCredentialsProvider()

    // Initialize every Server
    const disposables = props.servers.map(s => {
        // Create server representation, processing LSP event handlers, in runtimes
        // and add it to the LSP router
        const lspServer = new LspServer()
        lspRouter.servers.push(lspServer)

        // Set up LSP events handlers per server
        const lsp: Lsp = {
            addInitializer: lspServer.addInitializeHandler,
            onInitialized: handler =>
                lspConnection.onInitialized(p => {
                    const workspaceCapabilities = lspRouter.clientInitializeParams?.capabilities.workspace
                    if (workspaceCapabilities?.didChangeConfiguration?.dynamicRegistration) {
                        // Ask the client to notify the server on configuration changes
                        lspConnection.client.register(DidChangeConfigurationNotification.type, undefined)
                    }
                    handler(p)
                }),
            onCompletion: handler => lspConnection.onCompletion(handler),
            onInlineCompletion: handler => lspConnection.onRequest(inlineCompletionRequestType, handler),
            didChangeConfiguration: handler => lspConnection.onDidChangeConfiguration(handler),
            onDidFormatDocument: handler => lspConnection.onDocumentFormatting(handler),
            onDidOpenTextDocument: handler => documentsObserver.callbacks.onDidOpenTextDocument(handler),
            onDidChangeTextDocument: handler => documentsObserver.callbacks.onDidChangeTextDocument(handler),
            onDidCloseTextDocument: handler => lspConnection.onDidCloseTextDocument(handler),
            onExecuteCommand: handler => lspServer.addExecuteCommandHandler,
            workspace: {
                getConfiguration: section => lspConnection.workspace.getConfiguration(section),
            },
            publishDiagnostics: params => lspConnection.sendNotification(PublishDiagnosticsNotification.method, params),
            sendProgress: <P>(type: ProgressType<P>, token: ProgressToken, value: P) => {
                return lspConnection.sendProgress(type, token, value)
            },
            onHover: handler => lspConnection.onHover(handler),
            extensions: {
                onInlineCompletionWithReferences: handler =>
                    lspConnection.onRequest(inlineCompletionWithReferencesRequestType, handler),
                onLogInlineCompletionSessionResults: handler => {
                    lspConnection.onNotification(logInlineCompletionSessionResultsNotificationType, handler)
                },
            },
        }

        return s({ chat, credentialsProvider, lsp, workspace, telemetry, logging })
    })

    // Free up any resources or threads used by Servers
    lspConnection.onExit(() => {
        disposables.forEach(d => d())
    })

    // Initialize the documents listener and start the LSP connection
    documents.listen(documentsObserver.callbacks)
    lspConnection.listen()
}
