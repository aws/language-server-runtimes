# Language Server Runtimes Types

Language Server Runtimes Types is a package containing types used by the [Language Server Runtimes](../runtimes/) package. The package name is `@aws/language-server-runtimes-types`.

This package is independent of [VSCode Protocol](https://github.com/microsoft/vscode-languageserver-node/tree/main/protocol) type definitions.
Interfaces defined here must contain only type definitions with no implementations or side effects. For example, it should not re-export classes from `vscode-languageserver-protocol` or `vscode-jsonrpc` packages.

## Main Exported Types

- Authentication types (e.g., `IamCredentials`, `BearerCredentials`)
- Chat-related types (e.g., `ChatParams`, `ChatResult`)
- Inline completion types (e.g., `InlineCompletionItemWithReferences`)
- LSP types

## License

This project is licensed under the Apache-2.0 License.