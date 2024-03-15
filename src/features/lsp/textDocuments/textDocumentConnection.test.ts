import assert from 'assert'
import {
    CancellationToken,
    DidChangeTextDocumentParams,
    DidCloseTextDocumentParams,
    DidOpenTextDocumentParams,
    DidSaveTextDocumentParams,
    NotificationHandler,
    RequestHandler,
    TextEdit,
    WillSaveTextDocumentParams,
} from 'vscode-languageserver'
import { TextDocumentConnection } from 'vscode-languageserver/lib/common/textDocuments'
import { observe } from './textDocumentConnection'

const notificationHandlers = {
    onDidOpenTextDocument: undefined as NotificationHandler<any> | undefined,
    onDidChangeTextDocument: undefined as NotificationHandler<any> | undefined,
    onDidCloseTextDocument: undefined as NotificationHandler<any> | undefined,
    onWillSaveTextDocument: undefined as NotificationHandler<any> | undefined,
    onDidSaveTextDocument: undefined as NotificationHandler<any> | undefined,
}

let onWillSaveTextDocumentWaitUntilHandler:
    | RequestHandler<WillSaveTextDocumentParams, TextEdit[] | undefined | null, void>
    | undefined = undefined

const testConnection: TextDocumentConnection = {
    onDidOpenTextDocument: (handler: NotificationHandler<DidOpenTextDocumentParams>) => {
        notificationHandlers.onDidOpenTextDocument = handler
        return { dispose: () => {} }
    },
    onDidChangeTextDocument: (handler: NotificationHandler<DidChangeTextDocumentParams>) => {
        notificationHandlers.onDidChangeTextDocument = handler
        return { dispose: () => {} }
    },
    onDidCloseTextDocument: (handler: NotificationHandler<DidCloseTextDocumentParams>) => {
        notificationHandlers.onDidCloseTextDocument = handler
        return { dispose: () => {} }
    },
    onWillSaveTextDocument: (handler: NotificationHandler<WillSaveTextDocumentParams>) => {
        notificationHandlers.onWillSaveTextDocument = handler
        return { dispose: () => {} }
    },
    onDidSaveTextDocument: (handler: NotificationHandler<DidSaveTextDocumentParams>) => {
        notificationHandlers.onDidSaveTextDocument = handler
        return { dispose: () => {} }
    },
    onWillSaveTextDocumentWaitUntil: (
        handler: RequestHandler<WillSaveTextDocumentParams, TextEdit[] | undefined | null, void>
    ) => {
        onWillSaveTextDocumentWaitUntilHandler = handler
        return { dispose: () => {} }
    },
}

describe('TextDocumentConnection', () => {
    let calledFirst = false
    let calledSecond = false
    beforeEach(() => {
        calledFirst = false
        calledSecond = false

        Object.keys(notificationHandlers).forEach(
            k => (notificationHandlers[k as keyof typeof notificationHandlers] = undefined)
        )
    })

    describe('without observable (baseline)', () => {
        Object.keys(notificationHandlers).forEach(key => {
            it(key + ' only supports the last callback', () => {
                testConnection[key as keyof typeof notificationHandlers](() => {
                    calledFirst = true
                })
                testConnection[key as keyof typeof notificationHandlers](() => (calledSecond = true))

                notificationHandlers[key as keyof typeof notificationHandlers]!({})

                assert.equal(calledFirst, false)
                assert.equal(calledSecond, true)
            })
        })
    })

    describe('with observable', () => {
        Object.keys(notificationHandlers).forEach(key => {
            let observableConnection: ReturnType<typeof observe>

            beforeEach(async () => {
                observableConnection = observe(testConnection)
            })

            it(key + ' supports multiple subscriptions', () => {
                observableConnection[key as keyof typeof notificationHandlers].subscribe(() => {
                    calledFirst = true
                })
                observableConnection[key as keyof typeof notificationHandlers].subscribe(() => (calledSecond = true))

                notificationHandlers[key as keyof typeof notificationHandlers]!({})

                assert.equal(calledFirst, true)
                assert.equal(calledSecond, true)
            })

            it(key + ' supports unsubscribe and resubscribe', () => {
                const sub = observableConnection[key as keyof typeof notificationHandlers].subscribe(() => {
                    calledFirst = true
                })
                sub.unsubscribe()
                observableConnection[key as keyof typeof notificationHandlers].subscribe(() => (calledSecond = true))

                notificationHandlers[key as keyof typeof notificationHandlers]!({})

                assert.equal(calledFirst, false)
                assert.equal(calledSecond, true)
            })

            it(key + ' supports callbacks', () => {
                observableConnection.callbacks[key as keyof typeof notificationHandlers](() => {
                    calledFirst = true
                })
                observableConnection.callbacks[key as keyof typeof notificationHandlers](() => {
                    calledSecond = true
                })

                notificationHandlers[key as keyof typeof notificationHandlers]!({})

                assert.equal(calledFirst, true)
                assert.equal(calledSecond, true)
            })

            it(key + ' supports callback dispose', () => {
                const disposable = observableConnection.callbacks[key as keyof typeof notificationHandlers](() => {
                    calledFirst = true
                })
                observableConnection.callbacks[key as keyof typeof notificationHandlers](() => {
                    calledSecond = true
                })

                disposable.dispose()

                notificationHandlers[key as keyof typeof notificationHandlers]!({})

                assert.equal(calledFirst, false)
                assert.equal(calledSecond, true)
            })
        })
    })

    describe('onWillSaeTextDocumentWaitUntil', () => {
        it('supports only last handler', () => {
            const connection = observe(testConnection)
            connection.callbacks.onWillSaveTextDocumentWaitUntil(p => {
                calledFirst = true
                return []
            })

            connection.callbacks.onWillSaveTextDocumentWaitUntil(p => {
                calledSecond = true
                return []
            })

            onWillSaveTextDocumentWaitUntilHandler!({} as WillSaveTextDocumentParams, CancellationToken.None)

            assert.equal(calledFirst, false)
            assert.equal(calledSecond, true)
        })
    })
})
