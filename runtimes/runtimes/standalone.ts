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
    ShowMessageNotification,
    ShowMessageRequest,
    ShowDocumentRequest,
    CancellationToken,
    GetSsoTokenParams,
    didChangeDependencyPathsNotificationType,
    openFileDiffNotificationType,
    selectWorkspaceItemRequestType,
} from '../protocol'
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node'
import {
    EncryptionInitialization,
    encryptObjectWithKey,
    readEncryptionDetails,
    shouldWaitForEncryptionKey,
    validateEncryptionDetails,
} from './auth/standalone/encryption'
import {
    Logging,
    Lsp,
    Telemetry,
    Workspace,
    CredentialsProvider,
    Chat,
    Runtime,
    getSsoTokenRequestType,
    IdentityManagement,
    invalidateSsoTokenRequestType,
    listProfilesRequestType,
    ssoTokenChangedRequestType,
    updateProfileRequestType,
    SDKClientConstructorV2,
    SDKClientConstructorV3,
    SDKInitializator,
} from '../server-interface'
import { Auth } from './auth'
import { EncryptedChat } from './chat/encryptedChat'

import { handleVersionArgument } from './versioning'
import { RuntimeProps } from './runtime'

import { observe } from './lsp'

import { mkdirSync, existsSync, readFileSync } from 'fs'
import { access, readdir, readFile, rm, stat, copyFile, writeFile, appendFile, mkdir } from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import { LspRouter } from './lsp/router/lspRouter'
import { LspServer } from './lsp/router/lspServer'
import { BaseChat } from './chat/baseChat'
import { checkAWSConfigFile } from './util/sharedConfigFile'
import { getServerDataDirPath } from './util/serverDataDirPath'
import { ProxyConfigManager } from './util/standalone/experimentalProxyUtil'
import { Encoding } from './encoding'
import { LoggingServer } from './lsp/router/loggingServer'
import { Service } from 'aws-sdk'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'
import { getTelemetryLspServer } from './util/telemetryLspServer'
import { getClientInitializeParamsHandlerFactory } from './util/lspCacheUtil'
import { makeProxyConfigv2Standalone, makeProxyConfigv3Standalone } from './util/standalone/proxyUtil'
import { newAgent } from './agent'

// Honor shared aws config file
if (checkAWSConfigFile()) {
    process.env.AWS_SDK_LOAD_CONFIG = '1'
}

process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err.message)
    process.exit(1)
})

/**
 * The runtime for standalone LSP-based servers.
 *
 * Initializes one or more Servers with the following features:
 * - CredentialsProvider: provides IAM and bearer credentials
 * - LSP: initializes a connection based on STDIN / STDOUT
 * - Logging: logs messages through the LSP connection
 * - Telemetry: emits telemetry through the LSP connection
 * - Workspace: tracks open and closed files from the LSP connection
 * - Chat: provides access to chat functionalities
 * - Runtime: holds information about runtime server and platform
 * - Identity Management: manages user profiles and SSO sessions
 * - Notification: sends notifications and follow-up actions
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
 * @param props Runtime initialization properties
 * @param props.servers The list of servers to initialize and run
 * @returns
 */
export const standalone = (props: RuntimeProps) => {
    handleVersionArgument(props.version)

    const lspConnection = createConnection(ProposedFeatures.all)
    const documentsObserver = observe(lspConnection)
    // Create router that will be routing LSP events from the client to server(s)
    const lspRouter = new LspRouter(lspConnection, props.name, props.version)

    let auth: Auth
    let chat: Chat
    initializeAuth()

    // Initialize Auth service
    function initializeAuth() {
        if (shouldWaitForEncryptionKey()) {
            // Before starting the runtime, accept encryption initialization details
            // directly from the destination for standalone runtimes.
            // Contract: Only read up to (and including) the first newline (\n).
            readEncryptionDetails(process.stdin)
                .then(
                    (encryptionDetails: EncryptionInitialization) => {
                        validateEncryptionDetails(encryptionDetails)
                        lspConnection.console.info('Runtime: Initializing runtime with encryption')
                        auth = new Auth(lspConnection, lspRouter, encryptionDetails.key, encryptionDetails.mode)
                        chat = new EncryptedChat(lspConnection, encryptionDetails.key, encryptionDetails.mode)
                        initializeRuntime(encryptionDetails.key)
                    },
                    error => {
                        console.error(error)
                        process.exit(10)
                    }
                )
                .catch((error: Error) => {
                    console.error('Error at runtime initialization:', error.message)
                })
        } else {
            lspConnection.console.info('Runtime: Initializing runtime without encryption')
            auth = new Auth(lspConnection, lspRouter)

            initializeRuntime()
        }
    }

    // Initialize the LSP connection based on the supported LSP capabilities
    // TODO: make this dependent on the actual requirements of the
    // capabilities parameter.

    function initializeRuntime(encryptionKey?: string) {
        const documents = new TextDocuments(TextDocument)
        // Set up telemetry over LSP
        const telemetry: Telemetry = {
            emitMetric: metric => lspConnection.telemetry.logEvent(metric),
            onClientTelemetry: handler => lspConnection.onNotification(telemetryNotificationType.method, handler),
        }

        // Set up the workspace sync to use the LSP Text Document Sync capability
        const workspace: Workspace = {
            getTextDocument: async uri => documents.get(uri),
            getAllTextDocuments: async () => documents.all(),
            // Get all workspace folders and return the workspace folder that contains the uri
            getWorkspaceFolder: uri => {
                const fileUrl = new URL(uri)
                const normalizedFileUri = fileUrl.pathname || ''

                const folders = lspRouter.clientInitializeParams!.workspaceFolders
                if (!folders) return undefined

                for (const folder of folders) {
                    const folderUrl = new URL(folder.uri)
                    const normalizedFolderUri = folderUrl.pathname || ''
                    if (normalizedFileUri.startsWith(normalizedFolderUri)) {
                        return folder
                    }
                }
            },
            fs: {
                copyFile: (src, dest, options?) => {
                    if (options?.ensureDir === true) {
                        const destDir = path.dirname(dest)
                        if (!existsSync(destDir)) {
                            mkdirSync(destDir, { recursive: true })
                        }
                    }
                    return copyFile(src, dest)
                },
                exists: path =>
                    access(path)
                        .then(() => true)
                        .catch(() => false),
                getFileSize: path => stat(path),
                getServerDataDirPath: serverName => getServerDataDirPath(serverName, lspRouter.clientInitializeParams),
                getTempDirPath: () =>
                    path.join(
                        // https://github.com/aws/aws-toolkit-vscode/issues/240
                        os.type() === 'Darwin' ? '/tmp' : os.tmpdir(),
                        'aws-language-servers'
                    ),
                readdir: path => readdir(path, { withFileTypes: true }),
                readFile: (path, options?) =>
                    readFile(path, { encoding: (options?.encoding || 'utf-8') as BufferEncoding }),
                rm: (dir, options?) => rm(dir, options),
                isFile: path => stat(path).then(({ isFile }) => isFile()),
                writeFile: (path, data) => writeFile(path, data),
                appendFile: (path, data) => appendFile(path, data),
                mkdir: (path, options?) => mkdir(path, options),
                readFileSync: (path, options?) =>
                    readFileSync(path, { encoding: (options?.encoding || 'utf-8') as BufferEncoding }),
            },
        }

        if (!encryptionKey) {
            chat = new BaseChat(lspConnection)
        }

        const identityManagement: IdentityManagement = {
            onListProfiles: handler => lspConnection.onRequest(listProfilesRequestType, handler),
            onUpdateProfile: handler => lspConnection.onRequest(updateProfileRequestType, handler),
            onGetSsoToken: handler =>
                lspConnection.onRequest(
                    getSsoTokenRequestType,
                    async (params: GetSsoTokenParams, token: CancellationToken) => {
                        const result = await handler(params, token)

                        // Encrypt SsoToken.accessToken before sending to client
                        if (result && !(result instanceof Error) && encryptionKey) {
                            if (result.ssoToken.accessToken) {
                                result.ssoToken.accessToken = await encryptObjectWithKey(
                                    result.ssoToken.accessToken,
                                    encryptionKey
                                )
                            }
                            if (result.updateCredentialsParams.data && !result.updateCredentialsParams.encrypted) {
                                result.updateCredentialsParams.data = await encryptObjectWithKey(
                                    // decodeCredentialsRequestToken expects nested 'data' fields
                                    { data: result.updateCredentialsParams.data },
                                    encryptionKey
                                )
                                result.updateCredentialsParams.encrypted = true
                            }
                        }

                        return result
                    }
                ),
            onInvalidateSsoToken: handler => lspConnection.onRequest(invalidateSsoTokenRequestType, handler),
            sendSsoTokenChanged: params => lspConnection.sendNotification(ssoTokenChangedRequestType, params),
        }

        const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

        const runtime: Runtime = {
            serverInfo: {
                name: props.name,
                version: props.version,
            },
            platform: os.platform(),
            // gets the configurations from the environment variables
            getConfiguration(key: string) {
                return process.env[key]
            },
        }

        const encoding: Encoding = {
            encode: value => Buffer.from(value).toString('base64'),
            decode: value => Buffer.from(value, 'base64').toString('utf-8'),
        }

        const loggingServer = new LoggingServer(lspConnection, encoding)
        const logging: Logging = loggingServer.getLoggingObject()
        lspRouter.servers.push(loggingServer.getLspServer())

        const telemetryLspServer = getTelemetryLspServer(lspConnection, encoding, logging, props, runtime)
        lspRouter.servers.push(telemetryLspServer)

        const sdkProxyConfigManager = new ProxyConfigManager(telemetry)

        // Initialize every Server
        const disposables = props.servers.map(s => {
            // Create LSP server representation that holds internal server state
            // and processes LSP event handlers
            const lspServer = new LspServer(lspConnection, encoding, logging)
            lspRouter.servers.push(lspServer)

            // Set up LSP events handlers per server
            // TODO: Move lsp feature inside lspServer
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
                onDidCloseTextDocument: handler => documentsObserver.callbacks.onDidCloseTextDocument(handler),
                onDidSaveTextDocument: handler => documentsObserver.callbacks.onDidSaveTextDocument(handler),
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
                    selectWorkspaceItem: params =>
                        lspConnection.sendRequest(selectWorkspaceItemRequestType.method, params),
                    openFileDiff: params => lspConnection.sendNotification(openFileDiffNotificationType.method, params),
                },
                window: {
                    showMessage: params => lspConnection.sendNotification(ShowMessageNotification.method, params),
                    showMessageRequest: params => lspConnection.sendRequest(ShowMessageRequest.method, params),
                    showDocument: params => lspConnection.sendRequest(ShowDocumentRequest.method, params),
                },
                publishDiagnostics: params =>
                    lspConnection.sendNotification(PublishDiagnosticsNotification.method, params),
                sendProgress: async <P>(type: ProgressType<P>, token: ProgressToken, value: P) => {
                    if (encryptionKey) {
                        const encryptedProgress = await encryptObjectWithKey(value as Object, encryptionKey)
                        return lspConnection.sendProgress(type, token, encryptedProgress as P)
                    }

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

            const isExperimentalProxy = process.env.EXPERIMENTAL_HTTP_PROXY_SUPPORT === 'true'
            const sdkInitializator: SDKInitializator = Object.assign(
                // Default v3 implementation as the callable function
                <T, P>(Ctor: SDKClientConstructorV3<T, P>, current_config: P): T => {
                    try {
                        const requestHandler = isExperimentalProxy
                            ? sdkProxyConfigManager.getV3ProxyConfig()
                            : makeProxyConfigv3Standalone(workspace)

                        logging.log(`Using ${isExperimentalProxy ? 'experimental' : 'standard'} proxy util`)

                        // setup proxy
                        let instance = new Ctor({
                            ...current_config,
                            requestHandler: requestHandler,
                        })
                        logging.log(`Configured AWS SDK V3 Proxy for ${Ctor.name}`)
                        return instance
                    } catch (err) {
                        telemetry.emitMetric({
                            name: 'runtime_httpProxyConfiguration',
                            result: 'Failed',
                            errorData: {
                                reason: err instanceof Error ? err.toString() : 'unknown',
                            },
                        })

                        // Fallback
                        logging.log(
                            `Failed to configure AWS SDK V3 Proxy for client ${Ctor.name}. Starting without proxy.`
                        )
                        return new Ctor({ ...current_config })
                    }
                },
                // v2 implementation as a property
                {
                    v2: <T extends Service, P extends ServiceConfigurationOptions>(
                        Ctor: SDKClientConstructorV2<T, P>,
                        current_config: P
                    ): T => {
                        let instance = new Ctor({ ...current_config })

                        try {
                            const configOptions = isExperimentalProxy
                                ? sdkProxyConfigManager.getV2ProxyConfig()
                                : makeProxyConfigv2Standalone(workspace)

                            logging.log(`Using ${isExperimentalProxy ? 'experimental' : 'standard'} proxy util`)

                            instance.config.update(configOptions)
                            logging.log(`Configured AWS SDK V2 Proxy for ${Ctor.name}`)
                            return instance
                        } catch (err) {
                            telemetry.emitMetric({
                                name: 'runtime_httpProxyConfiguration',
                                result: 'Failed',
                                errorData: {
                                    reason: err instanceof Error ? err.toString() : 'unknown',
                                },
                            })

                            // Fallback
                            logging.log(
                                `Failed to configure AWS SDK V2 Proxy for client ${Ctor.name}. Starting without proxy.`
                            )
                            return instance
                        }
                    },
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
}
