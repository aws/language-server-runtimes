/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { TextDocuments } from 'vscode-languageserver'
import {
    DidChangeWorkspaceFoldersNotification,
    ProgressToken,
    ProgressType,
    PublishDiagnosticsNotification,
    inlineCompletionWithReferencesRequestType,
    logInlineCompletionSessionResultsNotificationType,
    inlineCompletionRequestType,
    TextDocument,
    telemetryNotificationType,
    SemanticTokensRequest,
    didChangeDependencyPathsNotificationType,
    // Chat
    chatRequestType,
    endChatRequestType,
    quickActionRequestType,
    followUpClickNotificationType,
    sourceLinkClickNotificationType,
    infoLinkClickNotificationType,
    linkClickNotificationType,
    insertToCursorPositionNotificationType,
    feedbackNotificationType,
    readyNotificationType,
    tabChangeNotificationType,
    tabAddNotificationType,
    tabRemoveNotificationType,
    ShowMessageNotification,
    ShowMessageRequest,
    ShowDocumentRequest,
    openTabRequestType,
    openFileDiffNotificationType,
    selectWorkspaceItemRequestType,
    chatUpdateNotificationType,
    fileClickNotificationType,
    inlineChatRequestType,
    contextCommandsNotificationType,
    createPromptNotificationType,
    listConversationsRequestType,
    conversationClickRequestType,
    GetSerializedChatParams,
    GetSerializedChatResult,
    RequestHandler,
    TabBarActionParams,
    TabBarActionResult,
    getSerializedChatRequestType,
    tabBarActionRequestType,
} from '../protocol'
import { createConnection } from 'vscode-languageserver/browser'
import {
    Chat,
    Logging,
    Lsp,
    Runtime,
    Telemetry,
    Workspace,
    SDKClientConstructorV2,
    SDKClientConstructorV3,
    SDKInitializator,
    MessageReader,
    MessageWriter,
} from '../server-interface'
import { Auth } from './auth'

import { RuntimeProps } from './runtime'

import { observe } from './lsp'
import { LspRouter } from './lsp/router/lspRouter'
import { LspServer } from './lsp/router/lspServer'
import {
    getSsoTokenRequestType,
    invalidateSsoTokenRequestType,
    listProfilesRequestType,
    ssoTokenChangedRequestType,
    updateProfileRequestType,
} from '../protocol/identity-management'
import { IdentityManagement } from '../server-interface/identity-management'
import { WebBase64Encoding } from './encoding'
import { LoggingServer } from './lsp/router/loggingServer'
import { Service } from 'aws-sdk'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'
import { getClientInitializeParamsHandlerFactory } from './util/lspCacheUtil'
import { newAgent } from './agent'
import { ShowSaveFileDialogRequestType } from '../protocol/window'
import { join } from 'path'

declare const self: WindowOrWorkerGlobalScope

/**
 * Creates a runtime that uses the provided LSP connection transport
 *
 * @param connections - Object containing message reader and writer for LSP communication
 * @param connections.reader - MessageReader instance for reading LSP messages
 * @param connections.writer - MessageWriter instance for writing LSP messages
 * @returns A runtime function
 *
 */
export const baseRuntime = (connections: { reader: MessageReader; writer: MessageWriter }) => (props: RuntimeProps) => {
    const lspConnection = createConnection(connections.reader, connections.writer)

    const documentsObserver = observe(lspConnection)
    const documents = new TextDocuments(TextDocument)

    // Create router that will be routing LSP events from the client to server(s)
    const lspRouter = new LspRouter(lspConnection, props.name, props.version)

    // Set up telemetry over LSP
    const telemetry: Telemetry = {
        emitMetric: metric => lspConnection.telemetry.logEvent(metric),
        onClientTelemetry: handler => lspConnection.onNotification(telemetryNotificationType.method, handler),
    }

    // Set up the workspace to use the LSP Text Documents component
    const defaultHomeDir = '/home/user'
    const workspace: Workspace = {
        getTextDocument: async uri => documents.get(uri),
        getAllTextDocuments: async () => documents.all(),
        getWorkspaceFolder: _uri =>
            lspRouter.clientInitializeParams!.workspaceFolders && lspRouter.clientInitializeParams!.workspaceFolders[0],
        fs: {
            copyFile: (_src, _dest, _options?) => Promise.resolve(),
            exists: _path => Promise.resolve(false),
            getFileSize: _path => Promise.resolve({ size: 0 }),
            getServerDataDirPath: serverName =>
                join(
                    lspRouter.clientInitializeParams?.initializationOptions?.aws?.clientDataFolder ?? defaultHomeDir,
                    serverName
                ),
            getTempDirPath: () => '/tmp',
            getUserHomeDir: () => defaultHomeDir,
            readFile: (_path, _options?) => Promise.resolve(''),
            readdir: _path => Promise.resolve([]),
            isFile: _path => Promise.resolve(false),
            rm: (_dir, _options?) => Promise.resolve(),
            writeFile: (_path, _data) => Promise.resolve(),
            appendFile: (_path, _data) => Promise.resolve(),
            mkdir: (_path, _options?) => Promise.resolve(''),
            readFileSync: (_path, _options?) => '',
        },
    }

    const chat: Chat = {
        onChatPrompt: handler => lspConnection.onRequest(chatRequestType.method, handler),
        onInlineChatPrompt: handler => lspConnection.onRequest(inlineChatRequestType.method, handler),
        onEndChat: handler => lspConnection.onRequest(endChatRequestType.method, handler),
        onQuickAction: handler => lspConnection.onRequest(quickActionRequestType.method, handler),
        onSendFeedback: handler => lspConnection.onNotification(feedbackNotificationType.method, handler),
        onReady: handler => lspConnection.onNotification(readyNotificationType.method, handler),
        onTabAdd: handler => lspConnection.onNotification(tabAddNotificationType.method, handler),
        onTabChange: handler => lspConnection.onNotification(tabChangeNotificationType.method, handler),
        onTabRemove: handler => lspConnection.onNotification(tabRemoveNotificationType.method, handler),
        onCodeInsertToCursorPosition: handler =>
            lspConnection.onNotification(insertToCursorPositionNotificationType.method, handler),
        onLinkClick: handler => lspConnection.onNotification(linkClickNotificationType.method, handler),
        onInfoLinkClick: handler => lspConnection.onNotification(infoLinkClickNotificationType.method, handler),
        onSourceLinkClick: handler => lspConnection.onNotification(sourceLinkClickNotificationType.method, handler),
        onFollowUpClicked: handler => lspConnection.onNotification(followUpClickNotificationType.method, handler),
        openTab: params => lspConnection.sendRequest(openTabRequestType.method, params),
        sendChatUpdate: params => lspConnection.sendNotification(chatUpdateNotificationType.method, params),
        onFileClicked: handler => lspConnection.onNotification(fileClickNotificationType.method, handler),
        sendContextCommands: params => lspConnection.sendNotification(contextCommandsNotificationType.method, params),
        onCreatePrompt: handler => lspConnection.onNotification(createPromptNotificationType.method, handler),
        onListConversations: handler => lspConnection.onRequest(listConversationsRequestType.method, handler),
        onConversationClick: handler => lspConnection.onRequest(conversationClickRequestType.method, handler),
        getSerializedChat: params => lspConnection.sendRequest(getSerializedChatRequestType.method, params),
        onTabBarAction: handler => lspConnection.onRequest(tabBarActionRequestType.method, handler),
    }

    const identityManagement: IdentityManagement = {
        onListProfiles: handler => lspConnection.onRequest(listProfilesRequestType, handler),
        onUpdateProfile: handler => lspConnection.onRequest(updateProfileRequestType, handler),
        onGetSsoToken: handler => lspConnection.onRequest(getSsoTokenRequestType, handler),
        onInvalidateSsoToken: handler => lspConnection.onRequest(invalidateSsoTokenRequestType, handler),
        sendSsoTokenChanged: params => lspConnection.sendNotification(ssoTokenChangedRequestType, params),
    }

    // Set up auth without encryption
    const auth = new Auth(lspConnection, lspRouter)
    const credentialsProvider = auth.getCredentialsProvider()
    const runtime: Runtime = {
        serverInfo: {
            name: props.name,
            version: props.version,
        },
        platform: 'browser',
        getConfiguration(key: string) {
            return undefined
        },
    }

    const encoding = new WebBase64Encoding(self)
    const loggingServer = new LoggingServer(lspConnection, encoding)
    const logging: Logging = loggingServer.getLoggingObject()
    lspRouter.servers.push(loggingServer.getLspServer())

    // Initialize every Server
    const disposables = props.servers.map(s => {
        // Create server representation, processing LSP event handlers, in runtimes
        // and add it to the LSP router
        const lspServer = new LspServer(lspConnection, encoding, logging)
        lspRouter.servers.push(lspServer)

        // Set up LSP events handlers per server
        const lsp: Lsp = {
            addInitializer: lspServer.setInitializeHandler,
            onInitialized: lspServer.setInitializedHandler,
            getClientInitializeParams: getClientInitializeParamsHandlerFactory(lspRouter),
            onCompletion: handler => lspConnection.onCompletion(handler),
            onInlineCompletion: handler => lspConnection.onRequest(inlineCompletionRequestType, handler),
            didChangeConfiguration: lspServer.setDidChangeConfigurationHandler,
            onDidFormatDocument: handler => lspConnection.onDocumentFormatting(handler),
            onDidOpenTextDocument: handler => documentsObserver.callbacks.onDidOpenTextDocument(handler),
            onDidChangeTextDocument: handler => documentsObserver.callbacks.onDidChangeTextDocument(handler),
            onDidCloseTextDocument: handler => lspConnection.onDidCloseTextDocument(handler),
            onDidSaveTextDocument: handler => lspConnection.onDidSaveTextDocument(handler),
            onExecuteCommand: lspServer.setExecuteCommandHandler,
            onSemanticTokens: handler => lspConnection.onRequest(SemanticTokensRequest.type, handler),
            workspace: {
                applyWorkspaceEdit: params => lspConnection.workspace.applyEdit(params),
                getConfiguration: section => lspConnection.workspace.getConfiguration(section),
                onDidChangeWorkspaceFolders: handler =>
                    lspConnection.onNotification(DidChangeWorkspaceFoldersNotification.method, handler),
                onDidCreateFiles: params => lspConnection.workspace.onDidCreateFiles(params),
                onDidDeleteFiles: params => lspConnection.workspace.onDidDeleteFiles(params),
                onDidRenameFiles: params => lspConnection.workspace.onDidRenameFiles(params),
                onUpdateConfiguration: lspServer.setUpdateConfigurationHandler,
                selectWorkspaceItem: params => lspConnection.sendRequest(selectWorkspaceItemRequestType.method, params),
                openFileDiff: params => lspConnection.sendNotification(openFileDiffNotificationType.method, params),
            },
            window: {
                showMessage: params => lspConnection.sendNotification(ShowMessageNotification.method, params),
                showMessageRequest: params => lspConnection.sendRequest(ShowMessageRequest.method, params),
                showDocument: params => lspConnection.sendRequest(ShowDocumentRequest.method, params),
                showSaveFileDialog: params => lspConnection.sendRequest(ShowSaveFileDialogRequestType.method, params),
            },
            publishDiagnostics: params => lspConnection.sendNotification(PublishDiagnosticsNotification.method, params),
            sendProgress: <P>(type: ProgressType<P>, token: ProgressToken, value: P) => {
                return lspConnection.sendProgress(type, token, value)
            },
            onHover: handler => lspConnection.onHover(handler),
            onSignatureHelp: handler => lspConnection.onSignatureHelp(handler),
            extensions: {
                onGetConfigurationFromServer: lspServer.setServerConfigurationHandler,
                onInlineCompletionWithReferences: handler =>
                    lspConnection.onRequest(inlineCompletionWithReferencesRequestType, handler),
                onLogInlineCompletionSessionResults: handler => {
                    lspConnection.onNotification(logInlineCompletionSessionResultsNotificationType, handler)
                },
                onDidChangeDependencyPaths(handler) {
                    lspConnection.onNotification(didChangeDependencyPathsNotificationType, handler)
                },
            },
        }

        const sdkInitializator: SDKInitializator = Object.assign(
            // Default callable function for v3 clients
            <T, P>(Ctor: SDKClientConstructorV3<T, P>, current_config: P): T => new Ctor({ ...current_config }),
            // Property for v2 clients
            {
                v2: <T extends Service, P extends ServiceConfigurationOptions>(
                    Ctor: SDKClientConstructorV2<T, P>,
                    current_config: P
                ): T => new Ctor({ ...current_config }),
            }
        )
        credentialsProvider.onCredentialsDeleted = lspServer.setCredentialsDeleteHandler

        const agent = newAgent()

        return s({
            chat,
            credentialsProvider,
            lsp,
            workspace,
            telemetry,
            logging,
            runtime,
            identityManagement,
            notification: lspServer.notification,
            sdkInitializator: sdkInitializator,
            agent,
        })
    })

    // Free up any resources or threads used by Servers
    lspConnection.onExit(() => {
        disposables.forEach(d => d())
    })

    // Initialize the documents listener and start the LSP connection
    documents.listen(documentsObserver.callbacks)
    lspConnection.listen()
}
