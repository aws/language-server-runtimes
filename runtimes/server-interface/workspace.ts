import { TextDocument, WorkspaceFolder } from '../protocol'

// Minimal version of fs.Dirent
interface Dirent {
    isFile(): boolean
    isDirectory(): boolean
    name: string
    path: string
}

/**
 * The Workspace feature interface. Provides access to currently
 * open files in the workspace. May not provide full filesystem
 * access to files that are not currently open or outside the
 * workspace root.
 */
export type Workspace = {
    getTextDocument: (uri: string) => Promise<TextDocument | undefined>
    getAllTextDocuments: () => Promise<TextDocument[]>
    getWorkspaceFolder: (uri: string) => WorkspaceFolder | null | undefined
    fs: {
        /**
         * Copies a file from src to dest. Dest is overwritten if it already exists.
         * @param {string} src - The source path.
         * @param {string} dest - The destination path.
         * @param {boolean} [options.ensureDir] - Whether to create the destination directory if it doesn't exist, defaults to false.
         * @returns A promise that resolves when the copy operation is complete.
         */
        copyFile: (src: string, dest: string, options?: { ensureDir?: boolean }) => Promise<void>
        exists: (path: string) => Promise<boolean>
        getFileSize: (path: string) => Promise<{ size: number }>
        getServerDataDirPath: (serverName: string) => string
        getTempDirPath: () => string
        /**
         * Reads the contents of a directory.
         * @param {string} path - The path to the directory.
         * @returns A promise that resolves to an array of Dirent objects.
         */
        readdir: (path: string) => Promise<Dirent[]>
        /**
         * Reads the entire contents of a file.
         * @param {string} path - The path to the file.
         * @param {string} [options.encoding] - The encoding to use when reading the file, defaults to 'utf-8'.
         * @returns A promise that resolves to the contents of the file as a string.
         */
        readFile: (path: string, options?: { encoding?: string }) => Promise<string>
        isFile: (path: string) => Promise<boolean>
        rm: (dir: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>
        writeFile: (path: string, data: string) => Promise<void>
        appendFile: (path: string, data: string) => Promise<void>
        mkdir: (path: string, options?: { recursive?: boolean }) => Promise<string | undefined>
        /**
         * Reads the entire contents of a file.
         * @param {string} path - The path to the file.
         * @param {string} [options.encoding] - The encoding to use when reading the file, defaults to 'utf-8'.
         * @returns A string referring to the contents of the file.
         */
        readFileSync: (path: string, options?: { encoding?: string }) => string
    }
}
