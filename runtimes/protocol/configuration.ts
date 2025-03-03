/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { LSPAny, ProtocolRequestType, ResponseError } from './lsp'

/**
 * LSP Extension: Configuration Update Support
 *
 * This module implements an LSP extension that provides a push-based configuration
 * update mechanism with synchronous server response. This extends the standard LSP
 * configuration model to support scenarios requiring immediate confirmation of
 * configuration changes.
 *
 * The extension defines:
 * - UpdateConfigurationParams interface for specifying section and settings to update
 * - Protocol request type for configuration updates
 *
 * @remarks
 * This extension should only be used in limited scenarios where immediate server
 * response is required to maintain stable UX flow. For routine configuration updates,
 * the standard LSP configuration model using workspace/didChangeConfiguration should
 * be used instead.
 *
 * Example usage:
 * ```typescript
 * // Client-side request
 * const params: UpdateConfigurationParams = {
 *     section: "aws.amazonq",
 *     settings: { setting1: "value1" }
 * };
 * await client.sendRequest(updateConfigurationRequestType, params);
 * ```
 */
export interface UpdateConfigurationParams {
    section: string
    settings: LSPAny
}

export const updateConfigurationRequestType = new ProtocolRequestType<
    UpdateConfigurationParams,
    null,
    never,
    ResponseError,
    void
>('aws/updateConfiguration')
