/**
 * The SharedRegistry feature allows a Server to vend shared functionality to other
 * Servers in the same runtime by registering handlers which can then be invoked by
 * name in the other Servers.
 */
export type SharedRegistry = {
    /**
     * Registers a handler to the shared registry, after which it can be invoked
     * through the `invokeHandler` method.
     *
     * @param name The name under which the handler should be registered
     * @param handler The async function to execute when the handler is invoked by name
     */
    registerHandler: <T, R>(name: string, handler: (input: T) => Promise<R>) => void

    /**
     * Invokes the requested handler in the shared registry.
     *
     * This function throws if the handler is not found, and **does not**
     * handle any errors thrown by the invoked handler.
     *
     * @param handlerName The handler in the shared registry that should be invoked
     * @param input The input to the handler (if any)
     * @returns A promise for the result of the handler invocation
     */
    invokeHandler: (handlerName: string, input?: any) => Promise<any>

    /**
     *
     * @returns A list of names of the currently registered handlers
     */
    listHandlers: () => string[]
}
