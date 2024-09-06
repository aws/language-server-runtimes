import { Server } from '../server-interface'
import { AuthManagmentServiceHandlerFactory } from './services/authManagement'

/**
 * Properties used for runtime initialisation
 */
export type RuntimeProps = {
    /**
     * Version of the build artifact resulting from initialising the runtime with the list of servers
     */
    version?: string
    /**
     *  The list of servers to initialize and run
     */
    servers: Server[]
    /**
     * Name of the server used inside the runtime
     */
    name: string
    /**
     * Implementation handlers for runtimes services, providing features that are isolated from Server implementations
     * Services allow to inject specific implemenations of a functionality that mush be served by only one implementation
     * and can not be broadcasted to multiple implementations.
     */
    services?: {
        auth?: AuthManagmentServiceHandlerFactory
    }
}
