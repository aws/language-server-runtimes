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
import { Auth, CredentialsProvider } from "../features/auth/auth";

import { handleVersionArgument } from "../features/versioning";
import { RuntimeProps } from "./runtime";

import {
  inlineCompletionWithReferencesRequestType,
  logInlineCompletionSessionResultsNotificationType,
} from "../features/lsp/inline-completions/protocolExtensions";
import { observe } from "../features/lsp/textDocuments/textDocumentConnection";

import { access, mkdirSync, existsSync } from "fs";
import { readdir, readFile, rm, stat, copyFile } from "fs/promises";
import * as os from "os";
import * as path from "path";

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

    // Set up the workspace sync to use the LSP Text Document Sync capability
    const workspace: Workspace = {
      getTextDocument: async (uri) => documents.get(uri),
      // Get all workspace folders and return the workspace folder that contains the uri
      getWorkspaceFolder: (uri) => {
        const fileUrl = new URL(uri);
        const normalizedFileUri = fileUrl.pathname || "";

        const folders = clientInitializeParams.workspaceFolders;
        if (!folders) return undefined;

        for (const folder of folders) {
          const folderUrl = new URL(folder.uri);
          const normalizedFolderUri = folderUrl.pathname || "";
          if (normalizedFileUri.startsWith(normalizedFolderUri)) {
            return folder;
          }
        }
      },
      fs: {
        copy: (src, dest) => {
          const destDir = path.dirname(dest);
          if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
          }
          return copyFile(src, dest);
        },
        exists: (path) =>
          new Promise((resolve) => {
            access(path, (err) => {
              if (!err) resolve(true);
              resolve(false);
            });
          }),
        getFileSize: (path) => stat(path),
        getTempDirPath: () =>
          path.join(
            // https://github.com/aws/aws-toolkit-vscode/issues/240
            os.type() === "Darwin" ? "/tmp" : os.tmpdir(),
            "aws-language-servers",
          ),
        readdir: (path) => readdir(path, { withFileTypes: true }),
        readFile: (path) => readFile(path, "utf-8"),
        remove: (dir) => rm(dir, { recursive: true, force: true }),
      },
    };

    // Map the LSP client to the LSP feature.
    const lsp: Lsp = {
      onInitialized: (handler) =>
        lspConnection.onInitialized((p) => {
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
      onCompletion: (handler) => lspConnection.onCompletion(handler),
      onInlineCompletion: (handler) =>
        lspConnection.onRequest(inlineCompletionRequestType, handler),
      didChangeConfiguration: (handler) =>
        lspConnection.onDidChangeConfiguration(handler),
      onDidChangeTextDocument: (handler) =>
        documentsObserver.callbacks.onDidChangeTextDocument(handler),
      onDidCloseTextDocument: (handler) =>
        documentsObserver.callbacks.onDidCloseTextDocument(handler),
      workspace: {
        getConfiguration: (section) =>
          lspConnection.workspace.getConfiguration(section),
      },
      extensions: {
        onInlineCompletionWithReferences: (handler) =>
          lspConnection.onRequest(
            inlineCompletionWithReferencesRequestType,
            handler,
          ),
        onLogInlineCompletionSessionResults: (handler) => {
          lspConnection.onNotification(
            logInlineCompletionSessionResultsNotificationType,
            handler,
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
