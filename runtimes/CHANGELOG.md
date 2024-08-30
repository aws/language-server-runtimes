# Changelog

## [0.2.14] - 2024-08-30

- Extend LSP InitializeParams with custom `initializationInfo.aws` object to accept more custom data from client
- Add new `Runtime` Feature, passed from runtime to Server impementation during initialization

## [0.2.13] - 2024-08-16

- Add support for window/showDocument, window/showMessage and window/showMessageRequest LSP handler

## [0.2.12] - 2024-07-19

- Add onSignatureHelp request handler
- Fix chat runtime to allow "0" to be used as a partial token in chat request 

## [0.2.11] - 2024-07-15

- Fixed InitializeResult merge logic to account for arrays in the initiliaze handlers

## [0.2.10] - 2024-07-01

- Added support for `textDocument/semanticTokens/full` [LSP feature](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#semanticTokens_fullRequest)

## [0.2.9] - 2024-07-01

- Make sure errors are returned correctly in encrypted chat

## [0.2.8] - 2024-06-26

- Update error handling in encrypted chat 

## [0.2.7] - 2024-06-20

- Introduce encrypted chat class into the standalone runtime that decrypts incoming chat requests and decrypts outgoing chat responses on the runtime level

## [0.2.6] - 2024-06-05

- Extend server handshake to register chat quick actions

## [0.2.5] - 2024-05-17

- Extend telemetry endpoint in the protocol and add handler in Telemetry feature  

## [0.2.4] - 2024-05-10

- Remove `onCopyCodeToClipboard` and `onVote` events from chat interface

## [0.2.3] - 2024-04-24

- Added support for `didChangeWorkspaceFolders` notification to LSP feature
- Migrated away type definitons to new `@aws/language-server-runtimes-types` package
- Remove hardcoded `hoverProvider` from runtimes during connection handshake

## [0.2.2] - 2024-04-16

- Fixed Auth feature: allowed params by-name and by-position

## [0.2.1] - 2024-04-03

- Add routing to `LSP.executeCommand` server runtimes implementation: not runtimes will route LSP commands for execution to server between multiple registered servers

## [0.2.0] - 2024-03-26

- Refactored repository directories structure to better match project architecture
- Added new Chat feature to model and implement Chat-based GenAI assistant server feature
- Added support for `onDidFormatDocument` and `onDidOpenTextDocument` requests to LSP feature

## [0.1.1] - 2023-11-21

- Initial release containing `standalone` and `webworker` runtimes
