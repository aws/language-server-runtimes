import { Observable, fromEventPattern, share } from 'rxjs'
import {
    DidChangeTextDocumentParams,
    DidCloseTextDocumentParams,
    DidOpenTextDocumentParams,
    DidSaveTextDocumentParams,
    WillSaveTextDocumentParams,
    NotificationHandler,
    RequestHandler,
    TextEdit,
} from '../../../protocol'
import { TextDocumentConnection } from 'vscode-languageserver/lib/common/textDocuments'

// Filter out only the handlers that return void to avoid the request/response format,
// which would not support multiple handlers since it requires disambiguating the handler
// responsible for responding.
type TextDocumentNotifications = {
    [key in keyof TextDocumentConnection]: ReturnType<Parameters<TextDocumentConnection[key]>[0]> extends void
        ? key
        : never
}[keyof TextDocumentConnection]

type TextDocumentObservable = {
    [key in TextDocumentNotifications]: Observable<Parameters<Parameters<TextDocumentConnection[key]>[0]>[0]>
}

/**
 * Wrap a standard LSP {TextDocumentConnection}, that only supports a single callback for each operation,
 * with observables for each operation.
 *
 * This is useful for integrating mutliple Servers that each want to handle events one or more times. The {Observable}
 * interface allows for low-level control of subscribe, resubscribe, and notification handling. The callback interface
 * mimics the {TextDocumentConnection}, but does not overwrite each callback with the next.
 *
 * **Note:** {onWillSaveTextDocumentWaitUntil} will NOT support multiple handlers. The last registrered is the one
 * providing the return value. This is due to multiple handlers would have to disabiguate which one gets to
 * return the actual response, without some sort of smart merging of the desired edits.
 *
 * @param connection A {TextDocumentConnection} to wrap with observables
 * @returns A wrapper around the {TextDocumentConnection} providing both a callback and an observable interface
 */
export const observe = (
    connection: TextDocumentConnection
): { callbacks: TextDocumentConnection } & TextDocumentObservable => {
    const onDidChangeTextDocument = fromEventPattern<DidChangeTextDocumentParams>(
        connection.onDidChangeTextDocument
    ).pipe(share())
    const onDidOpenTextDocument = fromEventPattern<DidOpenTextDocumentParams>(connection.onDidOpenTextDocument).pipe(
        share()
    )
    const onDidCloseTextDocument = fromEventPattern<DidCloseTextDocumentParams>(connection.onDidCloseTextDocument).pipe(
        share()
    )
    const onWillSaveTextDocument = fromEventPattern<WillSaveTextDocumentParams>(connection.onWillSaveTextDocument).pipe(
        share()
    )
    const onDidSaveTextDocument = fromEventPattern<DidSaveTextDocumentParams>(connection.onDidSaveTextDocument).pipe(
        share()
    )

    return {
        callbacks: {
            onDidChangeTextDocument: (handler: NotificationHandler<DidChangeTextDocumentParams>) => {
                const subscription = onDidChangeTextDocument.subscribe(handler)
                return { dispose: () => subscription.unsubscribe() }
            },
            onDidOpenTextDocument: (handler: NotificationHandler<DidOpenTextDocumentParams>) => {
                const subscription = onDidOpenTextDocument.subscribe(handler)
                return { dispose: () => subscription.unsubscribe() }
            },
            onDidCloseTextDocument: (handler: NotificationHandler<DidCloseTextDocumentParams>) => {
                const subscription = onDidCloseTextDocument.subscribe(handler)
                return { dispose: () => subscription.unsubscribe() }
            },
            onWillSaveTextDocument: (handler: NotificationHandler<WillSaveTextDocumentParams>) => {
                const subscription = onWillSaveTextDocument.subscribe(handler)
                return { dispose: () => subscription.unsubscribe() }
            },
            onDidSaveTextDocument: (handler: NotificationHandler<DidSaveTextDocumentParams>) => {
                const subscription = onDidSaveTextDocument.subscribe(handler)
                return { dispose: () => subscription.unsubscribe() }
            },
            onWillSaveTextDocumentWaitUntil: (
                handler: RequestHandler<WillSaveTextDocumentParams, TextEdit[] | undefined | null, void>
            ) => {
                return connection.onWillSaveTextDocumentWaitUntil(handler)
            },
        },

        onDidChangeTextDocument,
        onDidOpenTextDocument,
        onDidCloseTextDocument,
        onWillSaveTextDocument,
        onDidSaveTextDocument,
    }
}
