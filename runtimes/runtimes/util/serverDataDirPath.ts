import * as path from 'path'
import * as os from 'os'
import { InitializeParams } from '../../protocol'

export function getServerDataDirPath(serverName: string, initializeParams: InitializeParams | undefined): string {
    const clientSpecifiedLocation = initializeParams?.initializationOptions?.aws?.clientDataFolder
    if (clientSpecifiedLocation) {
        return path.join(clientSpecifiedLocation, serverName)
    }

    const clientFolderName = getClientNameFromParams(initializeParams)
    const standardizedClientFolderName = standardizeFolderName(clientFolderName)

    const appDataFolder = getPlatformAppDataFolder()
    return appDataFolder === os.homedir()
        ? path.join(
              appDataFolder,
              `.${standardizedClientFolderName}`,
              standardizedClientFolderName ? serverName : `.${serverName}`
          )
        : path.join(appDataFolder, standardizedClientFolderName, serverName)
}

function getPlatformAppDataFolder(): string {
    switch (process.platform) {
        case 'win32':
            return process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')

        case 'darwin':
            return path.join(os.homedir(), 'Library', 'Application Support')

        case 'linux':
            return process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share')

        default:
            return os.homedir()
    }
}

function getClientNameFromParams(initializeParams: InitializeParams | undefined): string {
    const clientInfo = initializeParams?.clientInfo
    const awsClientInfo = initializeParams?.initializationOptions?.aws?.clientInfo

    return [awsClientInfo?.name || clientInfo?.name || '', awsClientInfo?.extension.name || '']
        .filter(Boolean)
        .join('_')
}

function standardizeFolderName(clientFolderName: string): string {
    return clientFolderName
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '_') // Replace non-alphanumeric characters with an underscore
        .replace(/_+/g, '_') // Replace multiple underscore characters with a single one
        .replace(/^_+|_+$/g, '') // Trim underscore characters
        .slice(0, 100) // Reduce the filename to avoid exceeding filesystem limits
}
