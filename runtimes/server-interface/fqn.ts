import type { WorkerPoolOptions } from 'workerpool'
import { Logging } from './logging'
import { Range } from 'vscode-languageserver-protocol'

export type FqnSupportedLanguages =
    | 'python'
    | 'java'
    | 'javascript'
    | 'javascriptreact'
    | 'typescript'
    | 'typescriptreact'

export type Result<TData, TError> =
    | {
          success: true
          data: TData
      }
    | {
          success: false
          data?: TData
          error: TError
      }

export type ExtractorResult = Result<FqnExtractorOutput, string>

export interface FullyQualifiedName {
    source: string[]
    symbol: string[]
}

export interface WorkerPoolConfig {
    logger?: Logging
    /**
     * time a task is allowed to run before terminated
     *
     * @default 5000ms
     */
    timeout?: number
    workerPoolOptions?: WorkerPoolOptions
}

export interface FqnExtractorOutput {
    fullyQualified: {
        declaredSymbols: FullyQualifiedName[]
        usedSymbols: FullyQualifiedName[]
    }
    simple: {
        declaredSymbols: FullyQualifiedName[]
        usedSymbols: FullyQualifiedName[]
    }
    externalSimple: {
        declaredSymbols: FullyQualifiedName[]
        usedSymbols: FullyQualifiedName[]
    }
}

export interface FqnExtractorInput {
    languageId: FqnSupportedLanguages
    fileText: string
    selection: Range
}

export type CancelFn = () => void

export interface IFqnWorkerPool {
    exec(input: FqnExtractorInput): [Promise<ExtractorResult>, CancelFn]
    dispose(): void
}
