import {
    RequestHandler,
    InitializeParams,
    InitializeError,
    CancellationToken,
    InitializeResult,
    TextDocumentSyncKind,
    ResponseError,
} from 'vscode-languageserver'
import { PartialInitializeResult } from '../features/lsp'

export class InitializeHandler {
    private handlers: RequestHandler<InitializeParams, PartialInitializeResult, InitializeError>[] = []
    public clientInitializeParams?: InitializeParams

    constructor(
        private name: string,
        private version?: string
    ) {}

    public onInitialize = async (
        params: InitializeParams,
        token: CancellationToken
    ): Promise<InitializeResult | ResponseError<InitializeError>> => {
        this.clientInitializeParams = params
        const defaultResponse: InitializeResult = {
            serverInfo: {
                name: this.name,
                version: this.version,
            },
            capabilities: {
                textDocumentSync: {
                    openClose: true,
                    change: TextDocumentSyncKind.Incremental,
                },
                hoverProvider: true,
            },
        }

        const responsesList = await Promise.all(this.handlers.map(f => asPromise(f(params, token))))
        if (responsesList.some(el => el instanceof ResponseError)) {
            return responsesList.find(el => el instanceof ResponseError) as ResponseError<InitializeError>
        }
        const resultList = responsesList as InitializeResult[]
        resultList.unshift(defaultResponse)
        return resultList.reduceRight((acc, curr) => {
            return mergeObjects(acc, curr)
        })
    }

    public addHandler = (handler: RequestHandler<InitializeParams, PartialInitializeResult, InitializeError>): void => {
        this.handlers.push(handler)
    }
}

function mergeObjects(obj1: any, obj2: any) {
    const merged: any = {}

    for (let key in obj1) {
        if (obj1.hasOwnProperty(key)) {
            if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
                merged[key] = mergeObjects(obj1[key], obj2[key])
            } else {
                merged[key] = obj1[key]
                if (obj2.hasOwnProperty(key)) {
                    merged[key] = obj2[key]
                }
            }
        }
    }

    for (let key in obj2) {
        if (obj2.hasOwnProperty(key) && !obj1.hasOwnProperty(key)) {
            merged[key] = obj2[key]
        }
    }
    return merged
}

function func(value: any): value is Function {
    return typeof value === 'function'
}

function thenable<T>(value: any): value is Thenable<T> {
    return value && func(value.then)
}

function asPromise<T>(value: Promise<T>): Promise<T>
function asPromise<T>(value: Thenable<T>): Promise<T>
function asPromise<T>(value: T): Promise<T>
function asPromise(value: any): Promise<any> {
    if (value instanceof Promise) {
        return value
    } else if (thenable(value)) {
        return new Promise((resolve, reject) => {
            value.then(
                resolved => resolve(resolved),
                error => reject(error)
            )
        })
    } else {
        return Promise.resolve(value)
    }
}
