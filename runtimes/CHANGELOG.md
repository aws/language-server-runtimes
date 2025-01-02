# Changelog

## [0.2.28](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.27...language-server-runtimes/v0.2.28) (2025-01-02)


### Features

* **runtimes:** log detail server info during initialization ([#285](https://github.com/aws/language-server-runtimes/issues/285)) ([cd4ac14](https://github.com/aws/language-server-runtimes/commit/cd4ac14381599c8599c70a6df85ac62cc9668832))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/language-server-runtimes-types bumped from ^0.0.7 to ^0.1.0

## [0.2.27] - 2024-11-15

### Changed
- Identity Management: Put SSO token inside the 'data' field for encrypted credentials as required by Auth

### Removed
- Identity Management: Removed implicit sso:account:access scope in aws-lsp-identity. Removing unnecessary option from UpdateProfile

## [0.2.26] - 2024-11-13

### Added
- Add GetSsoTokenResult.updateCredentialsParams to avoid decrypt/recrypt in destinations

## [0.2.25] - 2024-11-13

### Added
- Extended protocol with showNotification client capability
- Notification interface supports dynamic registration

## [0.2.24] - 2024-10-30

### Changed

- Updated `workspace.fs` methods: `remove` renamed to `rm`, `copy` renamed to `copyFile` and added `options` parameters. (#247)

## [0.2.23] - 2024-10-24

### Added

- Add `platform` value to `Runtime` feature injected in every Server (#244)

## [0.2.22] - 2024-10-24

### Added

- Add encryption to the accessToken in Identity Management protocol

### Changed

- Minor updates to `GetSsoToken` request parameters

### Removed

- Remove unused `onUpdateSsoTokenManagement` in Identity Management protocol

## [0.2.21] - 2024-10-23

### Added

- Add `workspace/applyEdit` functionality to the LSP interface
- Add `writeFile`, `appendFile` and `mkdir` functionality to `workspace.fs`
- Create `Notification` interface for servers

### Changed

- Update `@aws/language-server-runtimes-types` dependency from 0.0.6 to 0.0.7

## [0.2.20] - 2024-10-11

### Changed

- Relax error codes in Identity Management protocol (#223).
- Minor changes in Identity Management protocol (#222).

## [0.2.19] - 2024-10-09

- Update Identity Management protocol definition
- Export Identity Management interfaces in `server-interface`

## [0.2.18] - 2024-09-25

- Extend LSP interface with `getAvailableServerConfigurations` that allows clients to request available server configuration values
- Extend `InitializeResult.awsServerCapabilities` with  `configurationProvider` field that allows servers to inform clients about available configuration fields
- Add `getAllTextDocuments` method to Workspace
- Add routing for `didChangeConfiguration` and `initialized` notifications to ensure all servers in a bundle get these notifications instead of the last server that registered a handler

## [0.2.17] - 2024-09-17

- Fix CVE-2024-45296: update `path-to-regexp` dependency

## [0.2.16] - 2024-09-13

- Extend the protocol and server interface with Identity Management feature 

## [0.2.15] - 2024-09-06

- Honor shared aws config file in the standalone runtime

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
