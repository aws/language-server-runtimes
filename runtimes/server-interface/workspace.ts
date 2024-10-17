import { FileHandle } from 'fs/promises'
import { TextDocument, WorkspaceFolder } from '../protocol'
import { MakeDirectoryOptions, WriteFileOptions } from 'fs'

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
        copy: (src: string, dest: string) => Promise<void>
        exists: (path: string) => Promise<boolean>
        getFileSize: (path: string) => Promise<{ size: number }>
        getTempDirPath: () => string
        readdir: (path: string) => Promise<Dirent[]>
        readFile: (path: string) => Promise<string>
        isFile: (path: string) => Promise<boolean>
        remove: (dir: string) => Promise<void>
        writeFile: (
            file: FileHandle | string | Buffer | URL,
            data: string | NodeJS.ArrayBufferView,
            options?: WriteFileOptions
        ) => Promise<void>
        appendFile: (
            path: FileHandle | string | Buffer | URL,
            data: string | Uint8Array,
            options?: WriteFileOptions
        ) => Promise<void>
        mkdir: (path: string | Buffer | URL, options?: MakeDirectoryOptions) => Promise<string | undefined>
    }
}
