# Language Server Runtimes

This project (the "runtime") defines the runtime library for creating a fully working [language server](https://github.com/aws/language-servers/tree/main). The runtime provides the interface of the servers, and expose the features of the protocol defined through them. All AWS Language Servers created using this implementation are stored in the [language-servers repo](https://github.com/aws/language-servers/tree/main).

## Where things go

- To create a new protocol or feature for all language servers: contribute to the [runtimes/](runtimes) package in this repo.
- To create a new "capability" for a particular language, contribute to the [language-servers](https://github.com/aws/language-servers/tree/main) repo.

## Structure

Monorepo

- [runtimes/](runtimes) - library for creating fully working runtimes for language servers
    - [protocol/](runtimes/protocol) - LSP based protocol for communications between language servers and clients
    - [runtimes/](runtimes/runtimes) - implementation of runtime features for language servers
    - [server-interface/](runtimes/server-interface) - server type definition to create language servers
- [types/](types) - type definitions for the runtimes

## Contributing

- [How to contribute](CONTRIBUTING.md#contributing)

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
