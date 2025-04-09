import { SharedRegistry } from '../server-interface/shared-registry'

type SharedHandler<T, R> = {
    name: string
    invoke: (input: T) => Promise<R>
}

export const newSharedRegistry = (): SharedRegistry => {
    const sharedHandlers: Record<string, SharedHandler<any, any>> = {}

    return {
        registerHandler: <T, R>(name: string, handler: (input: T) => Promise<R>) => {
            const sharedHandler: SharedHandler<T, R> = {
                name,
                invoke: handler,
            }

            sharedHandlers[name] = sharedHandler
        },
        invokeHandler: (handlerName: string, input?: any): Promise<any> => {
            const sharedHandler = sharedHandlers[handlerName]

            if (!sharedHandler) {
                throw new Error(`Handler ${handlerName} not found in shared registry.`)
            }

            return sharedHandler.invoke(input)
        },
        listHandlers: () => {
            return Object.keys(sharedHandlers)
        },
    }
}
