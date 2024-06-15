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

export type ExtractFqnResult = Result<ExtractFqnOutput, string>

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

export interface ExtractFqnOutput {
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

export interface ExtractFqnInput {
    languageId: FqnSupportedLanguages
    fileText: string
    selection?: Range
}

export type CancelFn = () => void

export type Cancellable<T> = [T, CancelFn]

export interface IFqnWorkerPool {
    extractFqn: ExtractFqn
    dispose(): void
}

export type ExtractFqn = (input: ExtractFqnInput) => Cancellable<Promise<ExtractFqnResult>>
