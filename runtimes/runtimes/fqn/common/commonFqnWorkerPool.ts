import { pool, Pool } from 'workerpool'
import { DEFAULT_MAX_QUEUE_SIZE, DEFAULT_MAX_WORKERS, DEFAULT_TIMEOUT, FQN_WORKER_ID } from './defaults'
import {
    Cancellable,
    ExtractFqnInput,
    ExtractFqnResult,
    IFqnWorkerPool,
    Logging,
    WorkerPoolConfig,
} from '../../../server-interface'

export class CommonFqnWorkerPool implements IFqnWorkerPool {
    #workerPool: Pool
    #logger?: Logging
    #timeout: number

    constructor(filePath: string, { timeout = DEFAULT_TIMEOUT, logger, workerPoolOptions }: WorkerPoolConfig = {}) {
        this.#timeout = timeout
        this.#logger = logger
        this.#workerPool = pool(filePath, {
            maxWorkers: DEFAULT_MAX_WORKERS,
            maxQueueSize: DEFAULT_MAX_QUEUE_SIZE,
            ...workerPoolOptions,
        })
    }

    public extractFqn(input: ExtractFqnInput): Cancellable<Promise<ExtractFqnResult>> {
        this.#logger?.log(`Extracting fully qualified names for ${input.languageId}`)

        const execPromise = this.#workerPool.exec(FQN_WORKER_ID, [input])

        return [
            // unfortunately, execPromise is not actually a Promise, so we need to wrap
            // it so it can be awaited
            new Promise(resolve => {
                execPromise
                    .timeout(this.#timeout)
                    .then(data => resolve(data as ExtractFqnResult))
                    .catch(error => {
                        const errorMessage = `Encountered error while extracting fully qualified names: ${
                            error instanceof Error ? error.message : 'Unknown'
                        }`

                        this.#logger?.error(errorMessage)

                        return resolve({
                            success: false,
                            error: errorMessage,
                        })
                    })
            }),
            execPromise.cancel,
        ]
    }

    public dispose() {
        this.#workerPool.terminate(true)
    }
}
