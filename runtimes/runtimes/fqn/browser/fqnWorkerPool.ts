import { ExtractFqnInput, IFqnWorkerPool, Cancellable, ExtractFqnResult } from '../../../server-interface'

// TODO: implement logic for browser/webworker environment
export class FqnWorkerPool implements IFqnWorkerPool {
    public extractFqn(_input: ExtractFqnInput): Cancellable<Promise<ExtractFqnResult>> {
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
