export type IamCredentials = {
    readonly accessKeyId: string
    readonly secretAccessKey: string
    readonly sessionToken?: string
}

export type BearerCredentials = {
    readonly token: string
}

export interface SsoProfileData {
    startUrl?: string
}

export interface ConnectionMetadata {
    sso?: SsoProfileData
}

export interface UpdateCredentialsParams {
    // Plaintext Credentials (for browser based environments) or encrypted JWT token
    data: IamCredentials | BearerCredentials | string
    metadata?: ConnectionMetadata
    // If the payload is encrypted
    // Defaults to false if undefined or null
    encrypted?: boolean
}
