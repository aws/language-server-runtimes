export type IamCredentials = {
    type: "iam",
    accessKeyId: string,
    secretAccessKey: string,
}

export type BearerCredentials = {
    type: "bearer",
    token: string,
}

export type CredentialsType = "iam" | "bearer"
export type Credentials = IamCredentials | BearerCredentials

/**
 * The Auth feature interface. Supports IAM and Bearer credentials.
 */
export type Auth = {
    hasCredentials: (type: CredentialsType) => boolean,
    getCredentials: (type: CredentialsType) => Credentials | undefined
}