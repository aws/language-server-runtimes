import { TextDocument } from 'vscode-languageserver-textdocument'

/**
 * The Workspace feature interface. Provides access to currently
 * open files in the workspace. May not provide full filesystem
 * access to files that are not currently open or outside the 
 * workspace root.
 */
export type Workspace = {
    getTextDocument: (uri: string) => Promise<TextDocument | undefined>
}