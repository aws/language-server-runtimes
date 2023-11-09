import { jwtDecrypt } from "jose";
import { Connection } from "vscode-languageserver";
import { CredentialsEncoding } from "./standalone/encryption";

export type IamCredentials = {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly sessionToken?: string;
};

export type BearerCredentials = {
  readonly token: string;
};

export type CredentialsType = "iam" | "bearer";
export type Credentials = IamCredentials | BearerCredentials;

export function isIamCredentials(
  credentials: Credentials,
): credentials is IamCredentials {
  const iamCredentials = credentials as IamCredentials;
  return (
    iamCredentials?.accessKeyId !== undefined &&
    iamCredentials?.secretAccessKey !== undefined
  );
}

export function isBearerCredentials(
  credentials: Credentials,
): credentials is BearerCredentials {
  return (credentials as BearerCredentials)?.token !== undefined;
}

export interface SsoProfileData {
  startUrl?: string;
}

export interface ConnectionMetadata {
  sso?: SsoProfileData;
}

export interface CredentialsProvider {
  hasCredentials: (type: CredentialsType) => boolean;
  getCredentials: (type: CredentialsType) => Credentials | undefined;
  getConnectionMetadata: () => ConnectionMetadata | undefined;
}

export const credentialsProtocolMethodNames = {
  iamCredentialsUpdate: "$/aws/credentials/iam/update",
  iamCredentialsDelete: "$/aws/credentials/iam/delete",
  bearerCredentialsUpdate: "$/aws/credentials/token/update",
  bearerCredentialsDelete: "$/aws/credentials/token/delete",
  getConnectionMetadata: "$/aws/credentials/getConnectionMetadata",
};

export interface UpdateCredentialsRequest {
  // Plaintext Credentials (for browser based environments) or encrypted JWT token
  data: string | Credentials;
  // If the payload is encrypted
  // Defaults to false if undefined or null
  encrypted?: boolean;
}

export class Auth {
  private iamCredentials: IamCredentials | undefined;
  private bearerCredentials: BearerCredentials | undefined;
  private credentialsProvider: CredentialsProvider;
  private connectionMetadata: ConnectionMetadata | undefined;

  private key: Buffer | undefined;
  private credentialsEncoding: CredentialsEncoding | undefined;

  constructor(
    private readonly connection: Connection,
    key?: string,
    encoding?: CredentialsEncoding,
  ) {
    if (key) {
      this.key = Buffer.from(key, "base64");
      this.credentialsEncoding = encoding;
    }

    this.credentialsProvider = {
      getCredentials: (type: CredentialsType): Credentials | undefined => {
        if (type === "iam") {
          return this.iamCredentials;
        }
        if (type === "bearer") {
          return this.bearerCredentials;
        }
        throw new Error(`Unsupported credentials type: ${type}`);
      },

      hasCredentials: (type: CredentialsType): boolean => {
        if (type === "iam") {
          return this.iamCredentials !== undefined;
        }
        if (type === "bearer") {
          return this.bearerCredentials !== undefined;
        }
        throw new Error(`Unsupported credentials type: ${type}`);
      },

      getConnectionMetadata: () => {
        return this.connectionMetadata;
      },
    };

    this.registerLspCredentialsUpdateHandlers();
  }

  public getCredentialsProvider(): CredentialsProvider {
    return this.credentialsProvider;
  }

  private areValidCredentials(creds: Credentials): boolean {
    return creds && (isIamCredentials(creds) || isBearerCredentials(creds));
  }

  private async registerLspCredentialsUpdateHandlers() {
    this.registerIamCredentialsUpdateHandlers();
    this.registerBearerCredentialsUpdateHandlers();
  }

  private registerIamCredentialsUpdateHandlers(): void {
    this.connection.console.info(
      "Runtime: Registering IAM credentials update handler",
    );

    this.connection.onRequest(
      credentialsProtocolMethodNames.iamCredentialsUpdate,
      async (request: UpdateCredentialsRequest) => {
        const iamCredentials = request.encrypted
          ? await this.decodeCredentialsRequestToken<IamCredentials>(request)
          : (request.data as IamCredentials);

        if (isIamCredentials(iamCredentials)) {
          this.setCredentials(iamCredentials);
          this.connection.console.info(
            "Runtime: Successfully saved IAM credentials",
          );
        } else {
          this.iamCredentials = undefined;
          throw new Error("Invalid IAM credentials");
        }
      },
    );

    this.connection.onNotification(
      credentialsProtocolMethodNames.iamCredentialsDelete,
      () => {
        this.iamCredentials = undefined;
        this.connection.console.info("Runtime: Deleted IAM credentials");
      },
    );
  }

  private registerBearerCredentialsUpdateHandlers(): void {
    this.connection.console.info(
      "Runtime: Registering bearer credentials update handler",
    );

    this.connection.onRequest(
      credentialsProtocolMethodNames.bearerCredentialsUpdate,
      async (request: UpdateCredentialsRequest) => {
        const bearerCredentials = request.encrypted
          ? await this.decodeCredentialsRequestToken<BearerCredentials>(request)
          : (request.data as BearerCredentials);

        if (isBearerCredentials(bearerCredentials)) {
          this.setCredentials(bearerCredentials);
          this.connection.console.info(
            "Runtime: Successfully saved bearer credentials",
          );

          await this.requestConnectionMetadata();
        } else {
          this.bearerCredentials = undefined;
          throw new Error("Invalid bearer credentials");
        }
      },
    );

    this.connection.onNotification(
      credentialsProtocolMethodNames.bearerCredentialsDelete,
      () => {
        this.bearerCredentials = undefined;
        this.connectionMetadata = undefined;
        this.connection.console.info("Runtime: Deleted bearer credentials");
      },
    );
  }

  private setCredentials(creds: Credentials) {
    if (this.areValidCredentials(creds)) {
      if (isIamCredentials(creds)) {
        this.iamCredentials = creds as IamCredentials;
        // Prevent modifying credentials by implementors
        Object.freeze(this.iamCredentials);
      } else {
        this.bearerCredentials = creds as BearerCredentials;
        Object.freeze(this.bearerCredentials);
      }
    }
  }

  private async decodeCredentialsRequestToken<T>(
    request: UpdateCredentialsRequest,
  ): Promise<T> {
    this.connection.console.info(
      "Runtime: Decoding encrypted credentials token",
    );
    if (!this.key) {
      throw new Error("No encryption key");
    }

    if (this.credentialsEncoding === "JWT") {
      this.connection.console.info("Decoding JWT token");
      const result = await jwtDecrypt(request.data as string, this.key, {
        clockTolerance: 60, // Allow up to 60 seconds to account for clock differences
        contentEncryptionAlgorithms: ["A256GCM"],
        keyManagementAlgorithms: ["dir"],
      });
      if (!result.payload.data) {
        throw new Error("JWT payload not found");
      }
      return result.payload.data as T;
    }
    throw new Error("Encoding mode not implemented");
  }

  private async requestConnectionMetadata() {
    try {
      const connectionMetadata =
        await this.connection.sendRequest<ConnectionMetadata>(
          credentialsProtocolMethodNames.getConnectionMetadata,
        );

      this.connectionMetadata = connectionMetadata;
      this.connection.console.info("Runtime: Connection metadata updated");
    } catch (error: any) {
      this.connectionMetadata = undefined;
      this.connection.console.info(
        `Runtime: Failed to update Connection metadata with error: ${
          error?.message || "unknown"
        }`,
      );
    }
  }
}
