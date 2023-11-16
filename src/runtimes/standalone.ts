import {
  DidChangeConfigurationNotification,
  InitializeParams,
  TextDocumentSyncKind,
  TextDocuments,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ProposedFeatures, createConnection } from "vscode-languageserver/node";
import {
  EncryptionInitialization,
  readEncryptionDetails,
  shouldWaitForEncryptionKey,
  validateEncryptionDetails,
} from "../features/auth/standalone/encryption";
import { Logging, Lsp, Telemetry, Workspace } from "../features";
import { inlineCompletionRequestType } from "../features/lsp/inline-completions/futureProtocol";
import { metric } from "../features/telemetry/telemetry";
import { Auth, CredentialsProvider } from "../features/auth/auth";

import { handleVersionArgument } from "../features/versioning";
import { RuntimeProps } from "./runtime";

import {
  inlineCompletionWithReferencesRequestType,
  logInlineCompletionSessionResultsNotificationType,
} from "../features/lsp/inline-completions/protocolExtensions";
import { observe } from "../features/lsp/textDocuments/textDocumentConnection";

type Handler<A = any[], B = any> = (...args: A extends any[] ? A : [A]) => B;

// Instruments a handler to emit telemetry without changing its signature. Supports async handlers.
// Tracks timing between invocation and completion of the handler, and emits a failure count (either 0 or 1)
// depending on whether the handler threw an error or not.
const withTelemetry =
  <H extends Handler, A extends Parameters<H>, B extends ReturnType<H>>(
    telemetry: Telemetry,
  ) =>
  (name: string, handler: H) =>
  (...args: A): B => {
    const startTime = new Date().valueOf();
    const result = handler(...args);
    Promise.resolve(result)
      .finally(() =>
        telemetry.emitMetric(
          metric(`${name}Time`, new Date().valueOf() - startTime),
        ),
      )
      .then(() => telemetry.emitMetric(metric(`${name}Error`, 0)))
      .catch(() => telemetry.emitMetric(metric(`${name}Error`, 1)));
    return result;
  };

// Instruments a handler to emit logging on invocation without changing its signature.
const withLogging =
  <H extends Handler, A extends Parameters<H>, B extends ReturnType<H>>(
    logging: Logging,
  ) =>
  (name: string, handler: H) =>
  (...args: A): B => {
    logging.log(`[${name}] was called`);
    return handler(...args);
  };

/**
 * The runtime for standalone LSP-based servers.
 *
 * Initializes one or more Servers with the following features:
 * - CredentialsProvider: provides IAM and bearer credentials
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
export const standalone = (props: RuntimeProps) => {
  handleVersionArgument(props.version);

  const lspConnection = createConnection(ProposedFeatures.all);
  const documentsObserver = observe(lspConnection);

  let auth: Auth;
  initializeAuth();

  // Initialize Auth service
  function initializeAuth() {
    if (shouldWaitForEncryptionKey()) {
      // Before starting the runtime, accept encryption initialization details
      // directly from the destination for standalone runtimes.
      // Contract: Only read up to (and including) the first newline (\n).
      readEncryptionDetails(process.stdin).then(
        (encryptionDetails: EncryptionInitialization) => {
          validateEncryptionDetails(encryptionDetails);
          lspConnection.console.info(
            "Runtime: Initializing runtime with encryption",
          );
          auth = new Auth(
            lspConnection,
            encryptionDetails.key,
            encryptionDetails.mode,
          );
          initializeRuntime();
        },
        (error) => {
          console.error(error);
          process.exit(10);
        },
      );
    } else {
      lspConnection.console.info(
        "Runtime: Initializing runtime without encryption",
      );
      auth = new Auth(lspConnection);
      initializeRuntime();
    }
  }

  // Initialize the LSP connection based on the supported LSP capabilities
  // TODO: make this dependent on the actual requirements of the
  // capabilities parameter.

  function initializeRuntime() {
    const documents = new TextDocuments(TextDocument);
    let clientInitializeParams: InitializeParams;

    lspConnection.onInitialize((params: InitializeParams) => {
      clientInitializeParams = params;
      return {
        serverInfo: {
          // TODO: make this configurable
          name: "AWS LSP Standalone",
          // This indicates the standalone server version and is updated
          // every time the standalone or any of the servers update.
          // Major version updates only happen for backwards incompatible changes.
          version: props.version,
        },
        capabilities: {
          textDocumentSync: {
            openClose: true,
            change: TextDocumentSyncKind.Incremental,
          },
        },
      };
    });

    // Set up logging over LSP
    // TODO: set up Logging once implemented
    const logging: Logging = {
      log: (message) =>
        lspConnection.console.info(`[${new Date().toISOString()}] ${message}`),
    };

    // Set up telemetry over LSP

    const telemetry: Telemetry = {
      emitMetric: (metric) => lspConnection.telemetry.logEvent(metric),
    };

    // TODO: This can probably be cleaned up a bit more.
    // This type ensures that the signature of the handler function does not change, even if we instrument it with telemetry or logging
    const withLspTelemetry: <
      H extends Handler,
      A extends Parameters<H>,
      B extends ReturnType<H>,
    >(
      name: string,
      handler: H,
    ) => (...args: A) => B = withTelemetry(telemetry);
    const withLspLogging: <
      H extends Handler,
      A extends Parameters<H>,
      B extends ReturnType<H>,
    >(
      name: string,
      handler: H,
    ) => (...args: A) => B = withLogging(logging);
    const instrument: <
      H extends Handler,
      A extends Parameters<H>,
      B extends ReturnType<H>,
    >(
      name: string,
      handler: H,
    ) => (...args: A) => B = (name: string, handler: any) =>
      withLspLogging(name, withLspTelemetry(name, handler));

    // Set up the workspace sync to use the LSP Text Document Sync capability
    const workspace: Workspace = {
      getTextDocument: instrument("getTextDocument", async (uri) =>
        documents.get(uri),
      ),
    };

    // Map the instrumented LSP client to the LSP feature.
    const lsp: Lsp = {
      onInitialized: (handler) =>
        lspConnection.onInitialized(
          instrument("onInitialized", (p) => {
            const workspaceCapabilities =
              clientInitializeParams?.capabilities.workspace;
            if (
              workspaceCapabilities?.didChangeConfiguration?.dynamicRegistration
            ) {
              // Ask the client to notify the server on configuration changes
              lspConnection.client.register(
                DidChangeConfigurationNotification.type,
                undefined,
              );
            }
            handler(p);
          }),
        ),
      onCompletion: (handler) =>
        lspConnection.onCompletion(instrument("onCompletion", handler)),
      onInlineCompletion: (handler) =>
        lspConnection.onRequest(
          inlineCompletionRequestType,
          instrument("onInlineCompletion", handler),
        ),
      didChangeConfiguration: (handler) =>
        lspConnection.onDidChangeConfiguration(
          instrument("didChangeConfiguration", handler),
        ),
      onDidChangeTextDocument: (handler) =>
        documentsObserver.callbacks.onDidChangeTextDocument(
          instrument("onDidChangeTextDocument", handler),
        ),
      onDidCloseTextDocument: (handler) =>
        documentsObserver.callbacks.onDidCloseTextDocument(
          instrument("onDidCloseTextDocument", handler),
        ),
      workspace: {
        getConfiguration: instrument("workspace.getConfiguration", (section) =>
          lspConnection.workspace.getConfiguration(section),
        ),
      },
      extensions: {
        onInlineCompletionWithReferences: (handler) =>
          lspConnection.onRequest(
            inlineCompletionWithReferencesRequestType,
            instrument("onInlineCompletionWithReferences", handler),
          ),
        onLogInlineCompletionSessionResults: (handler) => {
          lspConnection.onNotification(
            logInlineCompletionSessionResultsNotificationType,
            instrument("onLogInlineCompletionSessionResults", handler),
          );
        },
      },
    };

    const credentialsProvider: CredentialsProvider =
      auth.getCredentialsProvider();

    // Initialize every Server
    const disposables = props.servers.map((s) =>
      s({ credentialsProvider, lsp, workspace, telemetry, logging }),
    );

    // Free up any resources or threads used by Servers
    lspConnection.onExit(() => {
      disposables.forEach((d) => d());
    });

    // Initialize the documents listener and start the LSP connection
    documents.listen(documentsObserver.callbacks);
    lspConnection.listen();
  }
};
