# Proxy Configuration for AWS SDK

## Overview
The proxy configuration feature enables AWS SDK to work in environments with various HTTP proxy setups, including both explicitly configured proxies and transparent network proxies.

There are two versions of proxy configuration available:
- Old mechanism (default)
- New experimental mechanism that can be enabled by setting `EXPERIMENTAL_HTTP_PROXY_SUPPORT=true` in environmental variables

The following documentation details the new experimental mechanism.

## Certificate Management
The system aggregates SSL/TLS certificates from multiple sources:
1. Operating System certificates (automatically loaded)
2. Custom CA bundle passed in environmental variables

### Certificate Configuration
SSL/TLS connections are automatically secured using certificates from the operating system's trust store. Follow your operating system documentation for adding required certificates to system's trust store.

Custom certificates can be passed using next environmental variables:
- `AWS_CA_BUNDLE` - Path to custom CA bundle
- `NODE_EXTRA_CA_CERTS` - Path to additional CA certificates

## Supported Proxy Configurations

### 1. Explicit HTTP Proxy
The following environment variables are supported for proxy configuration (in order of precedence):
1. `HTTPS_PROXY`
2. `https_proxy`
3. `HTTP_PROXY`
4. `http_proxy`

#### Note on Support of `https://` Proxy
If proxy is using SSL and URL starts with `https://`, then path to proxy server root certificate must be set in `NODE_EXTRA_CA_CERTS`. At the moment, other methods of passing certificate are not supported and won't work.

### 2. Transparent Network Proxy
A transparent proxy (also known as an intercepting proxy) is a server that sits between computer and the internet, routing all network traffic through it without requiring explicit configuration in end user applications. This is typically set up by organization's network administrators to monitor and secure network traffic.

Runtimes Proxy feature supports Transparent Proxy by reading and configuring SDK clients with certificates from #Certificate Configuration section.

#### Troubleshooting Transparent Proxy
In case of connection issues:
1. Verify that organization's certificates are properly installed
2. Check with network administrator if additional certificates are required
3. Ensure your system's certificate store is up to date or path to certificate is set in `AWS_CA_BUNDLE` or `NODE_EXTRA_CA_CERTS` environment variables.
4. Examine LSP Client connection logs for any errors.
