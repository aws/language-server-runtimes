## AWS Language server runtimes

This folder contains implementation of AWS Language server runtimes and Runtimes features.

Each runtime implements a LSP server and opens communication channel with client over LSP connection. Runtime initialised all registered Capabilities.

Runtime sets up message passing, that translates Runtimes Protocol messages to a function calls to Capabilities features, defined in Server and server features interfaces.

Runtime implementation acts as a intermediate layer between Runtime Client and a Runtime Servers, injected into runtime at build time.
The runtime implements message passing between Client application and injected Servers, and interface with both by predefined APIs:
* **Runtime Protocol**: a protocol to define communication between Runtime and Client application (e.g. Runtime<->AWS Toolkit extension). It uses LSP (and JSON-RPC) connection as a transport.
* **Runtime Server Interface**: defines an interface of the Server and features exposed to Runtime Server developers (e.g. Runtime<->AWS CodeWhisperer server).
