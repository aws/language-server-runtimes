# Language Server Runtimes for AWS Monorepo

## Relation with Language Servers

This monorepo hosts the runtime library for creating a fully working language server. The runtime is responsible to provide the interface of the server and expose the features of the protocol defined through them. All official AWS Language Servers created using this implementation is stored in the [Language Servers repo](https://github.com/aws/language-servers/tree/main).

Want to create a new protocol or feature that would be available to all language servers? See what we already provide in [runtimes package](runtimes).

Want to create a new language capability? Head over to the [Language Servers repo](https://github.com/aws/language-servers/tree/main) and start building!

## Structure

Monorepo

```
.
── runtimes - library for creating fully working runtimes for language servers
    └── protocol - LSP based protocol for communications between language servers and clients
    └── runtimes - implementation of runtime features for language servers
    └── server-interface - server type definition to create language servers
── types - type definitions for the runtimes
```

## How To Contribute

[How to contribute to the language server.](CONTRIBUTING.md#contributing)

## Building The Language Server

[How to build the language server.](CONTRIBUTING.md#building-the-language-server)

## Troubleshooting

[Troubleshooting information.](CONTRIBUTING.md#troubleshooting)

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
