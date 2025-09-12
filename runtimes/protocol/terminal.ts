/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { RequestType } from 'vscode-languageserver-protocol'

/**
 * Parameters for executing a command in the IDE terminal
 */
export interface ExecuteTerminalCommandParams {
    /**
     * The command to execute
     */
    command: string

    /**
     * Working directory for command execution
     */
    cwd?: string

    /**
     * Environment variables to set for the command
     */
    env?: Record<string, string>

    /**
     * Whether to create a new terminal or reuse existing one
     */
    createNew?: boolean

    /**
     * Name for the terminal (if creating new)
     */
    terminalName?: string
}

/**
 * Result of terminal command execution
 */
export interface ExecuteTerminalCommandResult {
    /**
     * Exit code of the command
     */
    exitCode: number

    /**
     * Standard output from the command
     */
    stdout: string

    /**
     * Standard error from the command
     */
    stderr: string

    /**
     * Whether the command executed successfully
     */
    success: boolean

    /**
     * Optional message providing additional context
     */
    message?: string
}

/**
 * Request type for executing commands in terminal
 */
export const executeTerminalCommandRequest = new RequestType<
    ExecuteTerminalCommandParams,
    ExecuteTerminalCommandResult,
    void
>('aws/terminal/executeCommand')
