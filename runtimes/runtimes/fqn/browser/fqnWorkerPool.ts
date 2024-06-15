import { CancelFn, ExtractorResult, FqnExtractorInput, IFqnWorkerPool } from '../../../server-interface'

// TODO: implement logic for browser/webworker environment
export class FqnWorkerPool implements IFqnWorkerPool {
    public exec(_input: FqnExtractorInput): [Promise<ExtractorResult>, CancelFn] {
        return [
            Promise.resolve({
                success: true,
                data: {
                    fullyQualified: {
                        declaredSymbols: [],
                        usedSymbols: [],
                    },
                    simple: {
                        declaredSymbols: [],
                        usedSymbols: [],
                    },
                    externalSimple: {
                        declaredSymbols: [],
                        usedSymbols: [],
                    },
                },
            }),
            () => {},
        ]
    }

    public dispose() {}
}
