## AWS Language Server types

This module contains types, that define interfaces of features available to Server implementors and used by AWS Runtimes to provide it's features.

Server capabilities uses on Runtimes Protocol as a source of truth for types that used in both Server interface and Runtime Protocol.
Some features in Server interface pass payload received from Client unmodified, e.g. in LSP feature.