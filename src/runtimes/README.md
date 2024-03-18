## AWS Language server runtimes

This folder contains implementation of AWS Language server runtimes. It implements few specific implementations.

Each runtime implements a LSP server and opens communication channel with client over LSP connection. Runtime initialised all registered Capabilities.

Runtime sets up message passing, that translates Runtimes Protocol messages to a function calls to Capabilities features, defined in Server interface.
