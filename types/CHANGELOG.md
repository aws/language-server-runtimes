# Changelog

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
