import { Server, CredentialsProvider } from '../server-interface'

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
<<<<<<< HEAD
     * Credential provider to overwrite the default Auth mechanism over LSP. 
=======
     * Credential provider to overwrite the default Auth mechanism over LSP.
>>>>>>> cdd2072 (Enable injection of credentials provider)
     */
    credentialsProvider?: CredentialsProvider
}
