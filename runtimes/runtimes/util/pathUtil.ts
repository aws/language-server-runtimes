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
