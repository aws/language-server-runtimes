import type * as Fqn from '@aws/fully-qualified-names'
import { ExtractFqnInput, ExtractFqnOutput } from '../../../server-interface'

export async function findNamesWithinExtent(
    fqn: typeof Fqn,
    input: Required<ExtractFqnInput>
): Promise<ExtractFqnOutput> {
    const { fileText, languageId, selection } = input

    const startLocation = new fqn.Location(selection.start.line, selection.start.character)
    const endLocation = new fqn.Location(selection.end.line, selection.end.character)
    const extent = new fqn.Extent(startLocation, endLocation)

    switch (languageId) {
        case 'java':
            return fqn.Java.findNamesWithInExtent(fileText, extent)
        case 'javascript':
        case 'javascriptreact':
        case 'typescriptreact':
            return fqn.Tsx.findNamesWithInExtent(fileText, extent)
        case 'typescript':
            return fqn.TypeScript.findNamesWithInExtent(fileText, extent)
        case 'python':
            return fqn.Python.findNamesWithInExtent(fileText, extent)
        default:
            // ideally unreachable
            throw new Error(`Unsupported language: ${languageId}`)
    }
}

export async function findNames(fqn: typeof Fqn, input: ExtractFqnInput): Promise<ExtractFqnOutput> {
    const { fileText, languageId, selection } = input

    if (selection) {
        return findNamesWithinExtent(fqn, { fileText, languageId, selection })
    }

    switch (languageId) {
        case 'java':
            return fqn.Java.findNames(fileText)
        case 'javascript':
        case 'javascriptreact':
        case 'typescriptreact':
            return fqn.Tsx.findNames(fileText)
        case 'typescript':
            return fqn.TypeScript.findNames(fileText)
        case 'python':
            return fqn.Python.findNames(fileText)
        default:
            // ideally unreachable
            throw new Error(`Unsupported language: ${languageId}`)
    }
}
