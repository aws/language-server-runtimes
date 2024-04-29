import { Range, Position } from './lsp'

// Minimal version of fs.Dirent
export interface Dirent {
    isFile(): boolean
    isDirectory(): boolean
    name: string
    path: string
}

export interface CursorStateChangeParams {
    cursorState: { position: Position } | { range: Range }
}
