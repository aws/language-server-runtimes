# Changelog

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
