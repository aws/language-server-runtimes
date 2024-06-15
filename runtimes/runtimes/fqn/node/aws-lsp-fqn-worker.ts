import * as fqn from '@aws/fully-qualified-names'
import { worker } from 'workerpool'
import { FQN_WORKER_ID } from '../common/defaults'
import { findNames } from '../common/fqnExtractor'
import { ExtractFqnInput } from '../../../server-interface'

async function fqnWorker(input: ExtractFqnInput) {
    try {
        const data = await findNames(fqn, input)

        return { data, success: true }
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'unknown' }
    }
}

worker({
    [FQN_WORKER_ID]: fqnWorker,
})
