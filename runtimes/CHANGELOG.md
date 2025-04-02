# Changelog

## [0.2.52](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.51...language-server-runtimes/v0.2.52) (2025-04-02)


### Bug Fixes

* add requestId to InlineChat response ([#403](https://github.com/aws/language-server-runtimes/issues/403)) ([3bee702](https://github.com/aws/language-server-runtimes/commit/3bee70222b6d9bd3e5bde3b046593be2e80b8d4c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/language-server-runtimes-types bumped from ^0.1.8 to ^0.1.9

## [0.2.51](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.50...language-server-runtimes/v0.2.51) (2025-04-01)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/language-server-runtimes-types bumped from ^0.1.7 to ^0.1.8

## [0.2.50](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.49...language-server-runtimes/v0.2.50) (2025-04-01)


### Features

* add extension for inline chat ([#391](https://github.com/aws/language-server-runtimes/issues/391)) ([52abd83](https://github.com/aws/language-server-runtimes/commit/52abd839b396c92863bca18c9bb33a7875192c3d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/language-server-runtimes-types bumped from ^0.1.6 to ^0.1.7

## [0.2.49](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.48...language-server-runtimes/v0.2.49) (2025-03-31)


### Features

* add agent interface for tool creation and usage ([c420d68](https://github.com/aws/language-server-runtimes/commit/c420d68c563260ea933907ceeefac117f5462ac9))

## [0.2.48](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.47...language-server-runtimes/v0.2.48) (2025-03-25)


### Bug Fixes

* put extended proxy behind feature flag ([#385](https://github.com/aws/language-server-runtimes/issues/385)) ([41b01bd](https://github.com/aws/language-server-runtimes/commit/41b01bd0131afc76c2dd52f5d3b763751352ca3e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/language-server-runtimes-types bumped from ^0.1.5 to ^0.1.6

## [0.2.47](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.46...language-server-runtimes/v0.2.47) (2025-03-20)


### Features

* extended protocol for conversation-based agents experience support ([#368](https://github.com/aws/language-server-runtimes/issues/368)) ([0bc496e](https://github.com/aws/language-server-runtimes/commit/0bc496ea8d9411b68efe7901168f5f8257a61a8e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/language-server-runtimes-types bumped from ^0.1.4 to ^0.1.5

## [0.2.46](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.45...language-server-runtimes/v0.2.46) (2025-03-20)


### Features

* empty line PR to release https://github.com/aws/language-server-runtimes/pull/379 ([#382](https://github.com/aws/language-server-runtimes/issues/382)) ([2663a5e](https://github.com/aws/language-server-runtimes/commit/2663a5e748e1b63e5b422968af562fd39f9a0da2))

## [0.2.45](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.44...language-server-runtimes/v0.2.45) (2025-03-18)


### Features

* **runtimes:** cache and expose initializeParams as a feature ([#378](https://github.com/aws/language-server-runtimes/issues/378)) ([e3d4e17](https://github.com/aws/language-server-runtimes/commit/e3d4e1772d29955ae71a6761f1be3251c443215e))

## [0.2.44](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.43...language-server-runtimes/v0.2.44) (2025-03-17)


### Features

* **types:** add next token to inline completion interface ([d42a832](https://github.com/aws/language-server-runtimes/commit/d42a832a70d0ee23d4cde18c8771bf46b2f18048))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/language-server-runtimes-types bumped from ^0.1.3 to ^0.1.4

## [0.2.43](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.42...language-server-runtimes/v0.2.43) (2025-03-17)


### Features

* **runtimes:** extend awsClientCapabilities generically to signal server-specific capabilities ([9fd0f00](https://github.com/aws/language-server-runtimes/commit/9fd0f00a784521c9ae4dac360d2eb8c81ab299fa))


### Bug Fixes

* **runtimes:** add doUpdateConfiguration to TestFeatures ([21d5d1d](https://github.com/aws/language-server-runtimes/commit/21d5d1dc7c73499475b7c88c98d2ce760e5d26c8))

## [0.2.42](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.41...language-server-runtimes/v0.2.42) (2025-03-12)


### Bug Fixes

* **runtimes:** maintain nodejs built-in certificates for SDK proxy configuration ([#362](https://github.com/aws/language-server-runtimes/issues/362)) ([83fa698](https://github.com/aws/language-server-runtimes/commit/83fa698b3d0446f1b3cb6f1237866910a966026f))

## [0.2.41](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.40...language-server-runtimes/v0.2.41) (2025-03-11)


### Features

* **types:** types for device code support ([#353](https://github.com/aws/language-server-runtimes/issues/353)) ([aa2fd53](https://github.com/aws/language-server-runtimes/commit/aa2fd53ab14bbe412ede696e7eb86cd19a9b9b0b))


### Bug Fixes

* fix the flaky test timeout error ([#359](https://github.com/aws/language-server-runtimes/issues/359)) ([b907843](https://github.com/aws/language-server-runtimes/commit/b9078435c918077215ff127ca8e84425bda9c4c0))

## [0.2.40](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.39...language-server-runtimes/v0.2.40) (2025-03-10)


### Features

* **runtimes:** emit telemetry from SDK proxy configuration utility ([a82a708](https://github.com/aws/language-server-runtimes/commit/a82a70810592909e1d82c74406124de847f1af0b))
* update protocol for regions use cases ([#355](https://github.com/aws/language-server-runtimes/issues/355)) ([50ef5c7](https://github.com/aws/language-server-runtimes/commit/50ef5c78e5d3e0c67c47b32ed147b7e21fee8116))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/language-server-runtimes-types bumped from ^0.1.2 to ^0.1.3

## [0.2.39](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.38...language-server-runtimes/v0.2.39) (2025-03-06)


### Features

* **runtimes:** add UpdateConfiguration protocol and server handlers ([df24447](https://github.com/aws/language-server-runtimes/commit/df244475bf08caafd6fb4c905de8fbbce970af1d))


### Bug Fixes

* **runtimes:** catch unhandled encryption validation and process exeptions ([e950103](https://github.com/aws/language-server-runtimes/commit/e9501038192fbc6acfa144f48c33faeef61d69d8))

## [0.2.38](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.37...language-server-runtimes/v0.2.38) (2025-02-27)


### Features

* add new lsp extension to send dependency information from client to servers ([#338](https://github.com/aws/language-server-runtimes/issues/338)) ([cbaf65f](https://github.com/aws/language-server-runtimes/commit/cbaf65fa67df3173ded718b7c93b29054129d3c7))
* get telemetry aws config from env variables ([#345](https://github.com/aws/language-server-runtimes/issues/345)) ([e2d7267](https://github.com/aws/language-server-runtimes/commit/e2d7267aff2a5c3d3fe92131b9478319a9a91c6e))
* **runtimes:** extended network proxy support ([7369086](https://github.com/aws/language-server-runtimes/commit/7369086ad519843f0dfc74f7124e23f129f21e63))


### Bug Fixes

* add missing telemetry files ([#344](https://github.com/aws/language-server-runtimes/issues/344)) ([e592796](https://github.com/aws/language-server-runtimes/commit/e592796f901000e58fbdf93860a50ea697adaa89))
* export operational telemetry schemas ([#340](https://github.com/aws/language-server-runtimes/issues/340)) ([5b4ca25](https://github.com/aws/language-server-runtimes/commit/5b4ca25a03a3cfe5671bb01eae8e1d3c92c3b979))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/language-server-runtimes-types bumped from ^0.1.1 to ^0.1.2

## [0.2.37](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.36...language-server-runtimes/v0.2.37) (2025-02-24)


### Features

* add opt-out mechanism to operational telemetry ([#330](https://github.com/aws/language-server-runtimes/issues/330)) ([0de11b1](https://github.com/aws/language-server-runtimes/commit/0de11b10b5556848633df351defe84350c7b5da1))


### Bug Fixes

* moving the telemetry logging for initialization options to the l… ([#337](https://github.com/aws/language-server-runtimes/issues/337)) ([3f0a826](https://github.com/aws/language-server-runtimes/commit/3f0a8262ea8e809341ffce4f503517339267917b))

## [0.2.36](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.35...language-server-runtimes/v0.2.36) (2025-02-18)


### Features

* add operational telemetry interface ([#312](https://github.com/aws/language-server-runtimes/issues/312)) ([44ae86c](https://github.com/aws/language-server-runtimes/commit/44ae86c1f33b2a71702cc55b2ad78c2ec22e380f))

## [0.2.35](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.34...language-server-runtimes/v0.2.35) (2025-02-12)


### Features

* **runtimes:** extract reusable runtime logic into the `base-runtime.ts` ([ebcb52f](https://github.com/aws/language-server-runtimes/commit/ebcb52f66dca8c85d3a842b21c8dbaccb19d6ad0))


### Bug Fixes

* adding try/catch to initialize lsp server, added telemetry log events  ([#320](https://github.com/aws/language-server-runtimes/issues/320)) ([48b064b](https://github.com/aws/language-server-runtimes/commit/48b064b5b690e5ce49efff2066f60b58b6f283d2))

## [0.2.34](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.33...language-server-runtimes/v0.2.34) (2025-02-04)


### Features

* implement sdk runtime configurator to configure sdk clients at runtime ([#316](https://github.com/aws/language-server-runtimes/issues/316)) ([ef82756](https://github.com/aws/language-server-runtimes/commit/ef827565b32d1482b6e08d66b78774d7aed544eb))

## [0.2.33](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.32...language-server-runtimes/v0.2.33) (2025-01-28)


### Features

* add save option to initializeResult to allow LSP server to listen to save file events ([#309](https://github.com/aws/language-server-runtimes/issues/309)) ([d80688f](https://github.com/aws/language-server-runtimes/commit/d80688fe272cedd352a9e5ed8cd13279cad392a7))


### Bug Fixes

* explicit check for initializationOptions and add optional chaining ([#310](https://github.com/aws/language-server-runtimes/issues/310)) ([e97456d](https://github.com/aws/language-server-runtimes/commit/e97456d6d5352042364f860483ea2721fc3268e1))

## [0.2.32](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.31...language-server-runtimes/v0.2.32) (2025-01-27)


### Features

* **runtimes:** extend lsp with didSaveTextDocument and lsp.worksapce with didCreateFiles, didDeleteFiles and didRenameFiles ([e8df283](https://github.com/aws/language-server-runtimes/commit/e8df28359cdca9efdaf05dd963ef52d7fc45531b))


### Bug Fixes

* handling of aws object of initializationOptions and initialize error handling ([#306](https://github.com/aws/language-server-runtimes/issues/306)) ([f71547a](https://github.com/aws/language-server-runtimes/commit/f71547a7a27adb62231e2c096560988a09ff6fea))
* throw error on initialize fail ([#307](https://github.com/aws/language-server-runtimes/issues/307)) ([df148a2](https://github.com/aws/language-server-runtimes/commit/df148a27bf4d84ec3466920848eff3e70bef493a))

## [0.2.31](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.30...language-server-runtimes/v0.2.31) (2025-01-16)


### Features

* adding support for readFileSync method in workspace.fs ([#299](https://github.com/aws/language-server-runtimes/issues/299)) ([3ef292a](https://github.com/aws/language-server-runtimes/commit/3ef292a483d0f41e804511e1d951e09f5da36d46))

## [0.2.30](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.29...language-server-runtimes/v0.2.30) (2025-01-07)


### Features

* add env variables getter in runtime ([#295](https://github.com/aws/language-server-runtimes/issues/295)) ([93be997](https://github.com/aws/language-server-runtimes/commit/93be9970f8c6aa23f609220e0c132e37fe567210))

## [0.2.29](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes/v0.2.28...language-server-runtimes/v0.2.29) (2025-01-03)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/language-server-runtimes-types bumped from ^0.1.0 to ^0.1.1

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
