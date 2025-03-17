# Changelog

## [0.1.4](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes-types/v0.1.3...language-server-runtimes-types/v0.1.4) (2025-03-17)


### Features

* **types:** add next token to inline completion interface ([d42a832](https://github.com/aws/language-server-runtimes/commit/d42a832a70d0ee23d4cde18c8771bf46b2f18048))

## [0.1.3](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes-types/v0.1.2...language-server-runtimes-types/v0.1.3) (2025-03-10)


### Features

* update protocol for regions use cases ([#355](https://github.com/aws/language-server-runtimes/issues/355)) ([50ef5c7](https://github.com/aws/language-server-runtimes/commit/50ef5c78e5d3e0c67c47b32ed147b7e21fee8116))

## [0.1.2](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes-types/v0.1.1...language-server-runtimes-types/v0.1.2) (2025-02-27)


### Features

* add new lsp extension to send dependency information from client to servers ([#338](https://github.com/aws/language-server-runtimes/issues/338)) ([cbaf65f](https://github.com/aws/language-server-runtimes/commit/cbaf65fa67df3173ded718b7c93b29054129d3c7))

## [0.1.1](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes-types/v0.1.0...language-server-runtimes-types/v0.1.1) (2025-01-03)


### Bug Fixes

* **types:** fixed publish package contents ([#292](https://github.com/aws/language-server-runtimes/issues/292)) ([b3f5874](https://github.com/aws/language-server-runtimes/commit/b3f58743802116100091cf9e91a447c549185e92))

## [0.1.0](https://github.com/aws/language-server-runtimes/compare/language-server-runtimes-types/v0.0.7...language-server-runtimes-types/v0.1.0) (2025-01-02)


### ⚠ BREAKING CHANGES

* **types:** update the version of package to next minor. This commit does not actually contain a breaking change, only to trigger a release.

### Features

* **types:** updated readme ([#290](https://github.com/aws/language-server-runtimes/issues/290)) ([4a3cc75](https://github.com/aws/language-server-runtimes/commit/4a3cc7588ddd24b8dd23865649be675ebcce706c))


### Bug Fixes

* **types:** npm publish (with out folder) ([#287](https://github.com/aws/language-server-runtimes/issues/287)) ([a4f4fb2](https://github.com/aws/language-server-runtimes/commit/a4f4fb21df9d13446eb737a314835f0a6a3f9f74))


### Documentation

* **types:** update readme ([#291](https://github.com/aws/language-server-runtimes/issues/291)) ([a777c8d](https://github.com/aws/language-server-runtimes/commit/a777c8d926208f6ed759e02c11b6c2ab70bdb16f))

## [0.0.7] - 2024-10-22

### Updated
- Extend `ChatOptions` with optional `defaultTabData` which will allow capability servers to specify the default data to be shown on Chat UI
- Extend `InsertToCursorPositionParams` with two new optional fields: `cursorPosition` and `textDocument`

## [0.0.6] - 2024-06-20

- Move `ChatOptions` into `runtimes-types`
- Introduce `EncryptedChatParams` and `EncryptedQuickActionParams` to be used by runtimes

## [0.0.5] - 2024-06-05

- Move chat method names that were previously harcoded in the `runtimes` to `runtimes-types` as constants

## [0.0.4] - 2024-05-30

- Update `ReferenceTrackerInformation`, `ChatItemAction`, `FeedbackParams`, `InfoLinkClickParams`, `LinkClickParams`, `SourceLinkClickParams` request parameter types

## [0.0.3] - 2024-05-10

- Removed `VoteType`, `VoteParams` and `CopyCodeToClipboardParams` from Chat types

## [0.0.2] - 2024-05-06

- Update Chat and QuickAction request parameter types
- Fix main entry to the package

## [0.0.1] - 2024-04-24

- Initial release containing type definitions migrated from `@aws/language-server-runtimes` package
