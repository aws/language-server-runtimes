/**
 * This is example configuration of creating a bundle with only custom AuthManagementService injected into standalone runtime.
 * This setup produces a server, that only handles AuthManagement LSP requests.
 */

import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { standalone } from '@aws/language-server-runtimes/runtimes/standalone'
import { createAuthManagementService } from '../testing/TestAuthManagementService'

const props: RuntimeProps = {
    version: '0.1.0',
    servers: [], // Bundle does not contain any reusable Server implementations
    name: 'Example Auth Management Server Bundle',
    services: {
        // Inject custom AuthManagementService implementation in the build.
        auth: createAuthManagementService,
    },
}
standalone(props)
