import { URI } from 'vscode-languageserver-types'

export const SHOW_SAVE_FILE_DIALOG_REQUEST_METHOD = 'aws/showSaveFileDialog'

export interface ShowSaveFileDialogParams {
    // Using untyped string to aviod locking this too strickly.
    // TODO: Migrate to LanguageKind when it is released in 3.18.0
    // https://github.com/microsoft/vscode-languageserver-node/blob/main/types/src/main.ts#L1890-L1895
    supportedFormats?: string[]
    defaultUri?: URI
}

export interface ShowSaveFileDialogResult {
    targetUri: URI
}
