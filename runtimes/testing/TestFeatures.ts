import {
    Server,
    CredentialsProvider,
    Logging,
    Lsp,
    Telemetry,
    Workspace,
    Chat,
    Runtime,
    Notification,
    SDKClientConstructorV2,
    SDKClientConstructorV3,
    SDKInitializator,
    Agent,
} from '../server-interface'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import {
    CancellationToken,
    CompletionParams,
    DidChangeTextDocumentParams,
    DidOpenTextDocumentParams,
    DocumentFormattingParams,
    ExecuteCommandParams,
    HoverParams,
    InlineCompletionParams,
    SemanticTokensParams,
    TextDocument,
    SignatureHelpParams,
    UpdateConfigurationParams,
} from '../protocol'
import { IdentityManagement } from '../server-interface/identity-management'
import { Service } from 'aws-sdk'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'

/**
 * A test helper package to test Server implementations. Accepts a single callback
 * registration for each LSP event. You can use this helper to trigger LSP events
 * as many times as you want, calling the first registered callback with the event
 * params.
 *
 * You could instrument the stubs for all Features, but this is discouraged over
 * testing the effects and responses.
 */
export class TestFeatures {
    chat: StubbedInstance<Chat>
    credentialsProvider: StubbedInstance<CredentialsProvider>
    // TODO: This needs to improve, somehow sinon doesn't stub nested objects
    lsp: StubbedInstance<Lsp> & {
        workspace: StubbedInstance<Lsp['workspace']>
    } & {
        extensions: StubbedInstance<Lsp['extensions']>
    }
    workspace: StubbedInstance<Workspace>
    logging: StubbedInstance<Logging>
    telemetry: StubbedInstance<Telemetry>
    documents: {
        [uri: string]: TextDocument
    }
    runtime: StubbedInstance<Runtime>
    identityManagement: StubbedInstance<IdentityManagement>
    notification: StubbedInstance<Notification>
    sdkInitializator: SDKInitializator
    agent: Agent

    private disposables: (() => void)[] = []

    constructor() {
        this.chat = stubInterface<Chat>()
        this.credentialsProvider = stubInterface<CredentialsProvider>()
        this.lsp = stubInterface<
            Lsp & { workspace: StubbedInstance<Lsp['workspace']> } & {
                extensions: StubbedInstance<Lsp['extensions']>
            }
        >()
        this.lsp.workspace = stubInterface<typeof this.lsp.workspace>()
        this.lsp.extensions = stubInterface<typeof this.lsp.extensions>()
        this.workspace = stubInterface<Workspace>()
        this.logging = stubInterface<Logging>()
        this.telemetry = stubInterface<Telemetry>()
        this.documents = {}
        this.runtime = stubInterface<Runtime>()
        this.identityManagement = stubInterface<IdentityManagement>()
        this.notification = stubInterface<Notification>()
        this.sdkInitializator = Object.assign(
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
        this.workspace.getTextDocument.callsFake(async uri => this.documents[uri])
        this.workspace.getAllTextDocuments.callsFake(async () => Object.values(this.documents))
        this.agent = stubInterface<Agent>()
    }

    async start(server: Server) {
        this.disposables.push(server(this))
        return Promise.resolve(this).then(f => {
            this.lsp.onInitialized.args[0]?.[0]({})
            return f
        })
    }

    async doInlineCompletion(params: InlineCompletionParams, token: CancellationToken) {
        return this.lsp.onInlineCompletion.args[0]?.[0](params, token)
    }

    async doCompletion(params: CompletionParams, token: CancellationToken) {
        return this.lsp.onCompletion.args[0]?.[0](params, token)
    }

    async doSemanticTokens(params: SemanticTokensParams, token: CancellationToken) {
        return this.lsp.onSemanticTokens.args[0]?.[0](params, token)
    }

    async doFormat(params: DocumentFormattingParams, token: CancellationToken) {
        return this.lsp.onDidFormatDocument.args[0]?.[0](params, token)
    }

    async doHover(params: HoverParams, token: CancellationToken) {
        return this.lsp.onHover.args[0]?.[0](params, token)
    }

    async doSignatureHelp(params: SignatureHelpParams, token: CancellationToken) {
        return this.lsp.onSignatureHelp.args[0]?.[0](params, token)
    }

    async doInlineCompletionWithReferences(
        ...args: Parameters<Parameters<Lsp['extensions']['onInlineCompletionWithReferences']>[0]>
    ) {
        return this.lsp.extensions.onInlineCompletionWithReferences.args[0]?.[0](...args)
    }

    async doLogInlineCompletionSessionResults(
        ...args: Parameters<Parameters<Lsp['extensions']['onLogInlineCompletionSessionResults']>[0]>
    ) {
        return this.lsp.extensions.onLogInlineCompletionSessionResults.args[0]?.[0](...args)
    }

    openDocument(document: TextDocument) {
        this.documents[document.uri] = document
        return this
    }

    async doChangeConfiguration() {
        // Force the call to handle after the current task completes
        await undefined
        this.lsp.didChangeConfiguration.args[0]?.[0]({ settings: undefined })
        return this
    }

    async doChangeTextDocument(params: DidChangeTextDocumentParams) {
        // Force the call to handle after the current task completes
        await undefined
        this.lsp.onDidChangeTextDocument.args[0]?.[0](params)
        return this
    }

    async doOpenTextDocument(params: DidOpenTextDocumentParams) {
        // Force the call to handle after the current task completes
        await undefined
        this.lsp.onDidOpenTextDocument.args[0]?.[0](params)
        return this
    }

    async doExecuteCommand(params: ExecuteCommandParams, token: CancellationToken) {
        return this.lsp.onExecuteCommand.args[0]?.[0](params, token)
    }

    async doUpdateConfiguration(params: UpdateConfigurationParams, token: CancellationToken) {
        return this.lsp.workspace.onUpdateConfiguration.args[0]?.[0](params, token)
    }

    async simulateTyping(uri: string, text: string) {
        let remainder = text

        while (remainder.length > 0) {
            const document = this.documents[uri]!
            const contentChange = remainder.substring(0, 1)
            remainder = remainder.substring(1)
            const newDocument = TextDocument.create(
                document.uri,
                document.languageId,
                document.version + 1,
                document.getText() + contentChange
            )
            this.documents[uri] = newDocument

            const endPosition = document.positionAt(document.getText().length)
            const range = {
                start: endPosition,
                end: endPosition,
            }

            // Force the call to handle after the current task completes
            await undefined
            this.lsp.onDidChangeTextDocument.args[0]?.[0]({
                textDocument: {
                    uri,
                    version: document.version,
                },
                contentChanges: [
                    {
                        range,
                        text: contentChange,
                    },
                ],
            })
        }

        return this
    }

    dispose() {
        this.disposables.forEach(d => d())
    }
}
