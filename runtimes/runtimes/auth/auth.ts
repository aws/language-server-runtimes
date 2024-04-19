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

export function isIamCredentials(credentials: Credentials): credentials is IamCredentials {
    const iamCredentials = credentials as IamCredentials
    return iamCredentials?.accessKeyId !== undefined && iamCredentials?.secretAccessKey !== undefined
}

export function isBearerCredentials(credentials: Credentials): credentials is BearerCredentials {
    return (credentials as BearerCredentials)?.token !== undefined
}

export class Auth {
    private iamCredentials: IamCredentials | undefined
    private bearerCredentials: BearerCredentials | undefined
    private credentialsProvider: CredentialsProvider
    private connectionMetadata: ConnectionMetadata | undefined

    private key: Buffer | undefined
    private credentialsEncoding: CredentialsEncoding | undefined

    constructor(
        private readonly connection: Connection,
        key?: string,
        encoding?: CredentialsEncoding
    ) {
        if (key) {
            this.key = Buffer.from(key, 'base64')
            this.credentialsEncoding = encoding
        }

        this.credentialsProvider = {
            getCredentials: (type: CredentialsType): Credentials | undefined => {
                if (type === 'iam') {
                    return this.iamCredentials
                }
                if (type === 'bearer') {
                    return this.bearerCredentials
                }
                throw new Error(`Unsupported credentials type: ${type}`)
            },

            hasCredentials: (type: CredentialsType): boolean => {
                if (type === 'iam') {
                    return this.iamCredentials !== undefined
                }
                if (type === 'bearer') {
                    return this.bearerCredentials !== undefined
                }
                throw new Error(`Unsupported credentials type: ${type}`)
            },

            getConnectionMetadata: () => {
                return this.connectionMetadata
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
                this.iamCredentials = undefined
                throw new Error('Invalid IAM credentials')
            }
        })

        this.connection.onNotification(iamCredentialsDeleteNotificationType, () => {
            this.iamCredentials = undefined
            this.connection.console.info('Runtime: Deleted IAM credentials')
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
                this.connection.console.info('Runtime: Successfully saved bearer credentials')

                await this.requestConnectionMetadata()
            } else {
                this.bearerCredentials = undefined
                throw new Error('Invalid bearer credentials')
            }
        })

        this.connection.onNotification(bearerCredentialsDeleteNotificationType, () => {
            this.bearerCredentials = undefined
            this.connectionMetadata = undefined
            this.connection.console.info('Runtime: Deleted bearer credentials')
        })
    }

    private setCredentials(creds: Credentials) {
        if (this.areValidCredentials(creds)) {
            if (isIamCredentials(creds)) {
                this.iamCredentials = creds as IamCredentials
                // Prevent modifying credentials by implementors
                Object.freeze(this.iamCredentials)
            } else {
                this.bearerCredentials = creds as BearerCredentials
                Object.freeze(this.bearerCredentials)
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
        }
    }
}
