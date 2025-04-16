import assert from 'assert'
import { randomBytes } from 'node:crypto'
import * as jose from 'jose'
import { Duplex } from 'stream'
import {
    Connection,
    createConnection,
    DidChangeConfigurationParams,
    ExecuteCommandParams,
    InitializedParams,
    InitializeError,
    ServerRequestHandler,
} from 'vscode-languageserver/node'
import { Auth, BUILDER_ID_START_URL } from './auth'
import { InitializeParams, InitializeResult, ParameterStructures, UpdateCredentialsParams } from '../../protocol'
import { IamCredentials, BearerCredentials, CredentialsType, CredentialsProvider } from '../../server-interface'
import { LspRouter } from '../lsp/router/lspRouter'
import { NotificationHandler } from 'vscode-languageserver-protocol'

export const credentialsProtocolMethodNames = {
    iamCredentialsUpdate: 'aws/credentials/iam/update',
    iamCredentialsDelete: 'aws/credentials/iam/delete',
    bearerCredentialsUpdate: 'aws/credentials/token/update',
    bearerCredentialsDelete: 'aws/credentials/token/delete',
    getConnectionMetadata: 'aws/credentials/getConnectionMetadata',
}

class TestStream extends Duplex {
    _write(chunk: string, _encoding: string, done: () => void) {
        this.emit('data', chunk)
        done()
    }

    _read(_size: number) {}
}

const authHandlers = {
    iamUpdateHandler: async (request: UpdateCredentialsParams): Promise<void | Error> => {},
    iamDeleteHandler: () => {},
    bearerUpdateHandler: async (request: UpdateCredentialsParams): Promise<void | Error> => {},
    bearerDeleteHandler: () => {},
}

function clearHandlers() {
    authHandlers.iamUpdateHandler = async (request: UpdateCredentialsParams): Promise<void | Error> => {}
    authHandlers.iamDeleteHandler = () => {}
    authHandlers.bearerUpdateHandler = async (request: UpdateCredentialsParams): Promise<void | Error> => {}
    authHandlers.bearerDeleteHandler = () => {}
}

const serverLspConnectionMock = {
    onRequest: (requestType: any, handler: any) => {
        if (requestType.method === credentialsProtocolMethodNames.iamCredentialsUpdate) {
            authHandlers.iamUpdateHandler = handler
        }
        if (requestType.method === credentialsProtocolMethodNames.bearerCredentialsUpdate) {
            authHandlers.bearerUpdateHandler = handler
        }
    },
    onNotification: (requestType: any, handler: any) => {
        if (requestType.method === credentialsProtocolMethodNames.iamCredentialsDelete) {
            authHandlers.iamDeleteHandler = handler
        }
        if (requestType.method === credentialsProtocolMethodNames.bearerCredentialsDelete) {
            authHandlers.bearerDeleteHandler = handler
        }
    },
    console: {
        info: (str: string) => {
            console.log(str)
        },
        log: (str: string) => {
            console.log(str)
        },
        error: (str: string) => {
            console.log(str)
        },
        warn: (str: string) => {
            console.warn(str)
        },
    },
    onDidChangeConfiguration: (handler: NotificationHandler<DidChangeConfigurationParams>) => {},
    onExecuteCommand: (handler: ServerRequestHandler<ExecuteCommandParams, any, never, void>) => {},
    onInitialize: (handler: ServerRequestHandler<InitializeParams, InitializeResult, never, InitializeError>) => {},
    onInitialized: (handler: NotificationHandler<InitializedParams>) => {},
} as Connection

const lspRouter = new LspRouter(serverLspConnectionMock, 'name')

const bearerCredentials: BearerCredentials = {
    token: 'testToken',
}
const iamCredentials: IamCredentials = {
    accessKeyId: 'testKey',
    secretAccessKey: 'testSecret',
    sessionToken: 'testSession',
}

const encryptionKey = randomBytes(32)

describe('Auth', () => {
    let serverConnection: Connection
    let clientConnection: Connection

    beforeEach(() => {
        const up = new TestStream()
        const down = new TestStream()
        serverConnection = createConnection(up, down)
        clientConnection = createConnection(down, up)
        serverConnection.listen()
        clientConnection.listen()

        clearHandlers()
    })

    it('Handles IAM credentials', async () => {
        const updateRequest: UpdateCredentialsParams = {
            data: iamCredentials,
            encrypted: false,
        }
        const auth = new Auth(serverLspConnectionMock, lspRouter)
        const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

        assert(!credentialsProvider.hasCredentials('iam'))
        await authHandlers.iamUpdateHandler(updateRequest)

        assert(credentialsProvider.hasCredentials('iam'))
        assert.deepEqual(credentialsProvider.getCredentials('iam'), iamCredentials)

        authHandlers.iamDeleteHandler()
        assert(!credentialsProvider.hasCredentials('iam'))
        assert(credentialsProvider.getCredentials('iam') === undefined)
    })

    it('Handles Set Bearer credentials request when parameters sent by position', async () => {
        const updateRequest: UpdateCredentialsParams = {
            data: bearerCredentials,
            encrypted: false,
        }
        const auth = new Auth(serverConnection, lspRouter)
        const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

        assert(!credentialsProvider.hasCredentials('bearer'))

        // @ts-ignore
        await clientConnection.sendRequest(
            credentialsProtocolMethodNames.bearerCredentialsUpdate,
            ParameterStructures.byPosition,
            updateRequest
        )

        assert(credentialsProvider.hasCredentials('bearer'))
        assert.deepEqual(credentialsProvider.getCredentials('bearer'), bearerCredentials)
    })

    it('Handles Set Bearer credentials request', async () => {
        const updateRequest: UpdateCredentialsParams = {
            data: bearerCredentials,
            encrypted: false,
        }
        const auth = new Auth(serverConnection, lspRouter)
        const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

        assert(!credentialsProvider.hasCredentials('bearer'))

        await clientConnection.sendRequest(credentialsProtocolMethodNames.bearerCredentialsUpdate, updateRequest)

        assert(credentialsProvider.hasCredentials('bearer'))
        assert.deepEqual(credentialsProvider.getCredentials('bearer'), bearerCredentials)
    })

    it('Updates connection metadata on receiving Set Bearer credentials request with metadata', async () => {
        const CONNECTION_METADATA = {
            sso: {
                startUrl: 'testStartUrl',
            },
        }

        const updateRequest: UpdateCredentialsParams = {
            data: bearerCredentials,
            metadata: CONNECTION_METADATA,
            encrypted: false,
        }
        const auth = new Auth(serverConnection, lspRouter)
        const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

        assert(!credentialsProvider.getConnectionMetadata())

        await clientConnection.sendRequest(credentialsProtocolMethodNames.bearerCredentialsUpdate, updateRequest)

        assert.deepEqual(credentialsProvider.getConnectionMetadata(), CONNECTION_METADATA)
    })

    it('Requests connection metadata on receiving Set Bearer credentials request without metadata', async () => {
        const CONNECTION_METADATA = {
            sso: {
                startUrl: 'testStartUrl',
            },
        }
        clientConnection.onRequest(credentialsProtocolMethodNames.getConnectionMetadata, () => {
            return CONNECTION_METADATA
        })

        const updateRequest: UpdateCredentialsParams = {
            data: bearerCredentials,
            encrypted: false,
        }
        const auth = new Auth(serverConnection, lspRouter)
        const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

        assert(!credentialsProvider.getConnectionMetadata())

        await clientConnection.sendRequest(credentialsProtocolMethodNames.bearerCredentialsUpdate, updateRequest)

        assert.deepEqual(credentialsProvider.getConnectionMetadata(), CONNECTION_METADATA)
    })

    it('Updates Bearer credentials on failed get connection metadata request', async () => {
        clientConnection.onRequest(credentialsProtocolMethodNames.getConnectionMetadata, () => {
            console.log('FAILING GET METADATA REQUEST')
            throw new Error('TEST ERROR')
        })

        const updateRequest: UpdateCredentialsParams = {
            data: bearerCredentials,
            encrypted: false,
        }
        const auth = new Auth(serverConnection, lspRouter)
        const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

        await clientConnection.sendRequest(credentialsProtocolMethodNames.bearerCredentialsUpdate, updateRequest)

        assert.deepEqual(credentialsProvider.getConnectionMetadata(), undefined)
        assert.deepEqual(credentialsProvider.getCredentials('bearer'), bearerCredentials)
    })

    it('Handles Bearer credentials delete request', done => {
        const updateRequest: UpdateCredentialsParams = {
            data: bearerCredentials,
            encrypted: false,
        }
        const auth = new Auth(serverConnection, lspRouter)
        const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

        assert(!credentialsProvider.hasCredentials('bearer'))

        serverConnection.onNotification(credentialsProtocolMethodNames.bearerCredentialsDelete, () => {
            assert(!credentialsProvider.hasCredentials('bearer'))
            assert(credentialsProvider.getCredentials('bearer') === undefined)
            done()
        })
        clientConnection.sendNotification(credentialsProtocolMethodNames.bearerCredentialsDelete, updateRequest)
    })

    it('Rejects when IAM credentials are invalid', async () => {
        const malformedIamCredentials = {
            accessKeyId: 'testKey',
            sessionToken: 'testSession',
        }
        const updateIamRequest: UpdateCredentialsParams = {
            data: malformedIamCredentials as IamCredentials,
            encrypted: false,
        }
        const auth = new Auth(serverLspConnectionMock, lspRouter)
        const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

        await assert.rejects(authHandlers.iamUpdateHandler(updateIamRequest), /Invalid IAM credentials/)
        assert(!credentialsProvider.getCredentials('iam'))
    })

    it('Rejects when bearer credentials are invalid', async () => {
        const malformedBearerCredentials = {
            token: undefined as unknown,
        }
        const updateBearerRequest: UpdateCredentialsParams = {
            data: malformedBearerCredentials as BearerCredentials,
            encrypted: false,
        }
        const auth = new Auth(serverLspConnectionMock, lspRouter)
        const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

        await assert.rejects(authHandlers.bearerUpdateHandler(updateBearerRequest), /Invalid bearer credentials/)
        assert(!credentialsProvider.getCredentials('bearer'))
    })

    describe('Credentials provider', () => {
        it('Prevents modifying IAM credentials object', async () => {
            const updateIamRequest: UpdateCredentialsParams = {
                data: iamCredentials,
                encrypted: false,
            }
            const auth = new Auth(serverLspConnectionMock, lspRouter)
            const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

            await authHandlers.iamUpdateHandler(updateIamRequest)

            let creds: any = credentialsProvider.getCredentials('iam')
            const initialAccessKey = creds.accessKeyId

            assert.throws(() => (creds.accessKeyId = 'anotherKey'), /Cannot assign to read only property/)
            creds = {}
            assert((credentialsProvider.getCredentials('iam') as IamCredentials).accessKeyId === initialAccessKey)
        })

        it('Prevents modifying Bearer credentials object', async () => {
            const updateBearerRequest: UpdateCredentialsParams = {
                data: bearerCredentials,
                encrypted: false,
            }

            const auth = new Auth(serverLspConnectionMock, lspRouter)
            const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

            await authHandlers.bearerUpdateHandler(updateBearerRequest)

            let creds: any = credentialsProvider.getCredentials('bearer')
            const initialToken = creds.token
            assert.throws(() => (creds.token = 'anotherToken'), /Cannot assign to read only property/)
            creds = {}
            assert((credentialsProvider.getCredentials('bearer') as BearerCredentials).token === initialToken)
        })

        it('Throws on unsupported type', async () => {
            const auth = new Auth(serverLspConnectionMock, lspRouter)
            const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

            assert.throws(
                () => credentialsProvider.hasCredentials('unsupported_type' as CredentialsType),
                /Unsupported credentials type/
            )
            assert.throws(
                () => credentialsProvider.getCredentials('unsupported_type' as CredentialsType),
                /Unsupported credentials type/
            )
        })

        it('getConnectionType return builderId', async () => {
            const CONNECTION_METADATA = {
                sso: {
                    startUrl: BUILDER_ID_START_URL,
                },
            }

            const updateRequest: UpdateCredentialsParams = {
                data: bearerCredentials,
                metadata: CONNECTION_METADATA,
                encrypted: false,
            }
            const auth = new Auth(serverConnection, lspRouter)
            const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

            await clientConnection.sendRequest(credentialsProtocolMethodNames.bearerCredentialsUpdate, updateRequest)

            assert.deepEqual(credentialsProvider.getConnectionType(), 'builderId')
        })

        it('getConnectionType return identityCenter', async () => {
            const CONNECTION_METADATA = {
                sso: {
                    startUrl: 'https://idc.awsapps.com/start',
                },
            }

            const updateRequest: UpdateCredentialsParams = {
                data: bearerCredentials,
                metadata: CONNECTION_METADATA,
                encrypted: false,
            }
            const auth = new Auth(serverConnection, lspRouter)
            const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

            await clientConnection.sendRequest(credentialsProtocolMethodNames.bearerCredentialsUpdate, updateRequest)

            assert.deepEqual(credentialsProvider.getConnectionType(), 'identityCenter')
        })

        it('getConnectionType return none', async () => {
            const CONNECTION_METADATA = {
                sso: {},
            }

            const updateRequest: UpdateCredentialsParams = {
                data: bearerCredentials,
                metadata: CONNECTION_METADATA,
                encrypted: false,
            }
            const auth = new Auth(serverConnection, lspRouter)
            const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

            await clientConnection.sendRequest(credentialsProtocolMethodNames.bearerCredentialsUpdate, updateRequest)

            assert.deepEqual(credentialsProvider.getConnectionType(), 'none')
        })
    })

    describe('Encrypted credentials', () => {
        it('Rejects when encrypted flag is set wrong', async () => {
            const updateIamRequest: UpdateCredentialsParams = {
                data: iamCredentials,
                encrypted: true,
            }
            const auth = new Auth(serverLspConnectionMock, lspRouter)
            const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

            await assert.rejects(authHandlers.iamUpdateHandler(updateIamRequest), /No encryption key/)

            assert(!credentialsProvider.getCredentials('iam'))
        })

        it('Handles encrypted IAM credentials', async () => {
            const auth = new Auth(serverLspConnectionMock, lspRouter, encryptionKey.toString('base64'), 'JWT')
            const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

            const payload = { data: iamCredentials }

            const jwt = await new jose.EncryptJWT(payload)
                .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
                .encrypt(encryptionKey)

            const updateIamRequest: UpdateCredentialsParams = {
                data: jwt,
                encrypted: true,
            }
            await authHandlers.iamUpdateHandler(updateIamRequest)
            assert.deepEqual(credentialsProvider.getCredentials('iam'), iamCredentials)
        })

        it('Handles encrypted bearer credentials', async () => {
            const auth = new Auth(serverLspConnectionMock, lspRouter, encryptionKey.toString('base64'), 'JWT')
            const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

            const payload = { data: bearerCredentials }

            const jwt = await new jose.EncryptJWT(payload)
                .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
                .encrypt(encryptionKey)

            const updateBearerRequest: UpdateCredentialsParams = {
                data: jwt,
                encrypted: true,
            }
            await authHandlers.bearerUpdateHandler(updateBearerRequest)
            assert.deepEqual(credentialsProvider.getCredentials('bearer'), bearerCredentials)
        })

        it('Rejects if encryption algorithm is not direct A256GCM', async () => {
            const auth = new Auth(serverLspConnectionMock, lspRouter, encryptionKey.toString('base64'), 'JWT')
            const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

            const payload = { data: bearerCredentials }

            const jwt = await new jose.EncryptJWT(payload)
                .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
                .encrypt(encryptionKey)

            const updateBearerRequest: UpdateCredentialsParams = {
                data: jwt,
                encrypted: true,
            }
            await assert.rejects(
                authHandlers.bearerUpdateHandler(updateBearerRequest),
                /Header Parameter value not allowed/
            )
            assert(!credentialsProvider.getCredentials('bearer'))
        })

        it('Verifies JWT claims', async () => {
            const auth = new Auth(serverLspConnectionMock, lspRouter, encryptionKey.toString('base64'), 'JWT')
            const credentialsProvider: CredentialsProvider = auth.getCredentialsProvider()

            const payload = { data: bearerCredentials }

            const jwt = await new jose.EncryptJWT(payload)
                .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
                .setNotBefore(Date.now() / 1000 + 50) // allows up to 60s clockTolerance
                .setExpirationTime(Date.now() / 1000 - 70) // not allowed
                .encrypt(encryptionKey)

            const updateBearerRequest: UpdateCredentialsParams = {
                data: jwt,
                encrypted: true,
            }
            await assert.rejects(
                authHandlers.bearerUpdateHandler(updateBearerRequest),
                /"exp" claim timestamp check failed/
            )
            assert(!credentialsProvider.getCredentials('bearer'))
        })
    })
})
