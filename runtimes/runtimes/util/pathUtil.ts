/**
 * Simplified version of path.join that can be safely used on web
 * @param segments
 * @returns
 */
export function joinUnixPaths(...segments: string[]): string {
    // Filter out empty segments and normalize each segment
    const normalizedSegments = segments.filter(Boolean).map(segment => segment.replace(/^\/+|\/+$/g, ''))

    // Join segments with a single slash and then split to handle internal slashes
    const parts = normalizedSegments
        .join('/')
        .replace(/\/+/g, '/') // Replace multiple consecutive slashes with a single slash
        .split('/')

    const result = []

    for (const part of parts) {
        if (part === '..') {
            result.pop()
        } else if (part !== '.' && part !== '') {
            // Skip empty parts and current directory markers
            result.push(part)
        }
    }

    return result.join('/')
}

/**
 * Simplified version of path.basename that can be safely used on web
 * It should match the behaviour of the original
 * @param path The path to extract the basename from
 * @param ext Optional extension to remove from the result
 * @returns The last portion of the path, optionally with extension removed
 */
export function basenamePath(path: string, ext?: string): string {
    if (!path || typeof path !== 'string' || path === '') {
        return ''
    }

    // Normalize path separators and remove trailing slashes
    const normalizedPath = path.replace(/\\/g, '/').replace(/\/+$/, '')

    if (!normalizedPath || normalizedPath === '/') {
        return ''
    }

    // Find the last segment
    const lastSlashIndex = normalizedPath.lastIndexOf('/')
    const basename = lastSlashIndex === -1 ? normalizedPath : normalizedPath.slice(lastSlashIndex + 1)

    if (!basename || !ext) {
        return basename
    }

    // Remove extension if it matches
    if (ext.startsWith('.')) {
        return basename.endsWith(ext) && basename !== ext ? basename.slice(0, -ext.length) : basename
    } else {
        // For extensions without dot, check both with and without dot
        if (basename.endsWith(ext) && basename !== ext) {
            return basename.slice(0, -ext.length)
        }
        const dotExt = '.' + ext
        return basename.endsWith(dotExt) && basename !== dotExt ? basename.slice(0, -dotExt.length) : basename
    }
}
