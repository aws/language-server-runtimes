import { jwtDecrypt } from 'jose'
import { Connection } from 'vscode-languageserver'
import { CredentialsEncoding } from './standalone/encryption'
import {
    UpdateCredentialsParams,
    iamCredentialsUpdateRequestType,
    iamCredentialsDeleteNotificationType,
    bearerCredentialsUpdateRequestType,
    bearerCredentialsDeleteNotificationType,
    getConnectionMetadataRequestType,
} from '../../protocol'
import {
    IamCredentials,
    BearerCredentials,
    ConnectionMetadata,
    Credentials,
    CredentialsType,
    CredentialsProvider,
} from '../../server-interface'
import { LspRouter } from '../lsp/router/lspRouter'
import { OperationalTelemetryProvider, TELEMETRY_SCOPES } from '../operational-telemetry/operational-telemetry'

export const BUILDER_ID_START_URL = 'https://view.awsapps.com/start'

export function isIamCredentials(credentials: Credentials): credentials is IamCredentials {
    const iamCredentials = credentials as IamCredentials
    return iamCredentials?.accessKeyId !== undefined && iamCredentials?.secretAccessKey !== undefined
}

export function isBearerCredentials(credentials: Credentials): credentials is BearerCredentials {
    return (credentials as BearerCredentials)?.token !== undefined
}

export class Auth {
    private currentCredentials: IamCredentials | BearerCredentials | undefined
    // private iamCredentials: IamCredentials | undefined
    // private bearerCredentials: BearerCredentials | undefined
    private credentialsProvider: CredentialsProvider
    private connectionMetadata: ConnectionMetadata | undefined

    private key: Buffer | undefined
    private credentialsEncoding: CredentialsEncoding | undefined
    private lspRouter: LspRouter
    private credentialsDeleteHandler?: (type: CredentialsType) => void

    constructor(
        private readonly connection: Connection,
        lspRouter: LspRouter,
        key?: string,
        encoding?: CredentialsEncoding
    ) {
        if (key) {
            this.key = Buffer.from(key, 'base64')
            this.credentialsEncoding = encoding
        }
        this.lspRouter = lspRouter
        this.credentialsProvider = {
            getCredentials: (): Credentials | undefined => {
                if (this.currentCredentials === undefined) {
                    throw new Error(`Credentials undefined`)
                } else {
                    return this.currentCredentials
                }
            },

            hasCredentials: (): boolean => {
                return this.currentCredentials !== undefined
            },

            getCredentialsType: (): CredentialsType | undefined => {
                if (this.currentCredentials === undefined) {
                    throw new Error(`Credentials undefined`)
                } else if (isIamCredentials(this.currentCredentials)) {
                    return 'iam'
                } else {
                    return 'bearer'
                }
            },

            getConnectionMetadata: () => {
                return this.connectionMetadata
            },
            getConnectionType: () => {
                const startUrl = this.connectionMetadata?.sso?.startUrl
                return !startUrl ? 'none' : startUrl.includes(BUILDER_ID_START_URL) ? 'builderId' : 'identityCenter'
            },
            onCredentialsDeleted: (handler: (type: CredentialsType) => void) => {
                this.credentialsDeleteHandler = handler
            },
        }

        this.registerLspCredentialsUpdateHandlers()
    }

    public getCredentialsProvider(): CredentialsProvider {
        return this.credentialsProvider
    }

    private areValidCredentials(creds: Credentials): boolean {
        return creds && (isIamCredentials(creds) || isBearerCredentials(creds))
    }

    private async registerLspCredentialsUpdateHandlers() {
        this.registerIamCredentialsUpdateHandlers()
        this.registerBearerCredentialsUpdateHandlers()
    }

    private registerIamCredentialsUpdateHandlers(): void {
        this.connection.console.info('Runtime: Registering IAM credentials update handler')

        this.connection.onRequest(iamCredentialsUpdateRequestType, async (request: UpdateCredentialsParams) => {
            const iamCredentials = request.encrypted
                ? await this.decodeCredentialsRequestToken<IamCredentials>(request)
                : (request.data as IamCredentials)

            if (isIamCredentials(iamCredentials)) {
                this.setCredentials(iamCredentials)
                this.connection.console.info('Runtime: Successfully saved IAM credentials')
            } else {
                this.currentCredentials = undefined
                throw new Error('Invalid IAM credentials')
            }
        })

        this.connection.onNotification(iamCredentialsDeleteNotificationType, () => {
            if (this.currentCredentials !== undefined && isIamCredentials(this.currentCredentials)) {
                this.currentCredentials = undefined
                this.lspRouter.onCredentialsDeletion('iam')
                this.connection.console.info('Runtime: Deleted IAM credentials')
            } else {
                throw new Error('Attempt to delete IAM credentials when it does not exist')
            }
        })
    }

    private registerBearerCredentialsUpdateHandlers(): void {
        this.connection.console.info('Runtime: Registering bearer credentials update handler')

        this.connection.onRequest(bearerCredentialsUpdateRequestType, async (request: UpdateCredentialsParams) => {
            const bearerCredentials = request.encrypted
                ? await this.decodeCredentialsRequestToken<BearerCredentials>(request)
                : (request.data as BearerCredentials)

            if (isBearerCredentials(bearerCredentials)) {
                this.setCredentials(bearerCredentials)
                await this.handleBearerCredentialsMetadata(request.metadata)
                this.connection.console.info('Runtime: Successfully saved bearer credentials')
            } else {
                this.currentCredentials = undefined
                throw new Error('Invalid bearer credentials')
            }
        })

        this.connection.onNotification(bearerCredentialsDeleteNotificationType, () => {
            if (this.currentCredentials !== undefined && isBearerCredentials(this.currentCredentials)) {
                this.currentCredentials = undefined
                this.connectionMetadata = undefined
                this.lspRouter.onCredentialsDeletion('bearer')
                this.connection.console.info('Runtime: Deleted bearer credentials')
            } else {
                throw new Error('Attempt to delete Bearer credentials when it does not exist')
            }
        })
    }

    private async handleBearerCredentialsMetadata(metadata?: ConnectionMetadata) {
        if (metadata) {
            this.connectionMetadata = metadata
            return
        }
        this.connection.console.warn(
            'Runtime: metadata for bearer token connection was not provided - requesting from client'
        )
        await this.requestConnectionMetadata()
    }

    private setCredentials(creds: Credentials) {
        if (this.areValidCredentials(creds)) {
            if (isIamCredentials(creds)) {
                this.currentCredentials = creds as IamCredentials
                // Prevent modifying credentials by implementors
                Object.freeze(this.currentCredentials)
            } else {
                this.currentCredentials = creds as BearerCredentials
                Object.freeze(this.currentCredentials)
            }
        }
    }

    private async decodeCredentialsRequestToken<T>(request: UpdateCredentialsParams): Promise<T> {
        this.connection.console.info('Runtime: Decoding encrypted credentials token')
        if (!this.key) {
            throw new Error('No encryption key')
        }

        if (this.credentialsEncoding === 'JWT') {
            this.connection.console.info('Decoding JWT token')
            const result = await jwtDecrypt(request.data as string, this.key, {
                clockTolerance: 60, // Allow up to 60 seconds to account for clock differences
                contentEncryptionAlgorithms: ['A256GCM'],
                keyManagementAlgorithms: ['dir'],
            })
            if (!result.payload.data) {
                throw new Error('JWT payload not found')
            }
            return result.payload.data as T
        }
        throw new Error('Encoding mode not implemented')
    }

    private async requestConnectionMetadata() {
        try {
            const connectionMetadata = await this.connection.sendRequest(getConnectionMetadataRequestType)

            this.connectionMetadata = connectionMetadata
            this.connection.console.info('Runtime: Connection metadata updated')
        } catch (error: any) {
            this.connectionMetadata = undefined
            this.connection.console.info(
                `Runtime: Failed to update Connection metadata with error: ${error?.message || 'unknown'}`
            )
            OperationalTelemetryProvider.getTelemetryForScope(TELEMETRY_SCOPES.RUNTIMES).emitEvent({
                errorOrigin: 'caughtError',
                errorType: 'connectionMetadata',
                errorName: error?.name ?? 'unknown',
                errorCode: error?.code ?? '',
            })
        }
    }
}
