import { URI } from 'vscode-languageserver-types'

export const SHOW_SAVE_FILE_DIALOG_REQUEST_METHOD = 'aws/showSaveFileDialog'
export const SHOW_OPEN_FILE_DIALOG_REQUEST_METHOD = 'aws/showOpenFileDialog'
export const CHECK_DIAGNOSTICS_REQUEST_METHOD = 'aws/checkDiagnostics'
export interface ShowSaveFileDialogParams {
    // Using untyped string to avoid locking this too strictly.
    // TODO: Migrate to LanguageKind when it is released in 3.18.0
    // https://github.com/microsoft/vscode-languageserver-node/blob/main/types/src/main.ts#L1890-L1895
    supportedFormats?: string[]
    defaultUri?: URI
}

export interface ShowSaveFileDialogResult {
    targetUri: URI
}

// bridge to consume ide's api
export interface ShowOpenDialogParams {
    canSelectFiles?: boolean
    canSelectFolders?: boolean
    canSelectMany?: boolean
    filters?: { [key: string]: string[] }
    defaultUri?: URI
    title?: string
}

export interface ShowOpenDialogResult {
    uris: URI[]
}

export interface CheckDiagnosticsParams {
    filePaths: Record<string, any>
}

export interface CheckDiagnosticsResult {
    filePaths: Record<string, any>
}
