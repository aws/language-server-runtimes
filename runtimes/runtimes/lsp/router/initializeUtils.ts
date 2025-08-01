import { InitializeParams, WorkspaceFolder } from 'vscode-languageserver-protocol'
import { basenamePath } from '../../util/pathUtil'
import { URI } from 'vscode-uri'
import { RemoteConsole } from 'vscode-languageserver'

export function getWorkspaceFoldersFromInit(console: RemoteConsole, params?: InitializeParams): WorkspaceFolder[] {
    if (!params) {
        return []
    }

    if (params.workspaceFolders && params.workspaceFolders.length > 0) {
        return params.workspaceFolders
    }
    try {
        const getFolderName = (parsedUri: URI) => basenamePath(parsedUri.fsPath) || parsedUri.toString()

        if (params.rootUri) {
            const parsedUri = URI.parse(params.rootUri)
            const folderName = getFolderName(parsedUri)
            return [{ name: folderName, uri: params.rootUri }]
        }
        if (params.rootPath) {
            const parsedUri = URI.parse(params.rootPath)
            const folderName = getFolderName(parsedUri)
            return [{ name: folderName, uri: parsedUri.toString() }]
        }
        return []
    } catch (error) {
        console.error(`Error occurred when determining workspace folders: ${error}`)
        return []
    }
}
