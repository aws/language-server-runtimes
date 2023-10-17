import assert from "assert";
import { randomBytes } from "node:crypto";
import * as jose from "jose";
import { Connection } from "vscode-languageserver";
import {
  Auth,
  BearerCredentials,
  CredentialsProvider,
  CredentialsType,
  IamCredentials,
  UpdateCredentialsRequest,
  credentialsProtocolMethodNames,
} from "./auth";

const authHandlers = {
  iamUpdateHandler: async (
    request: UpdateCredentialsRequest,
  ): Promise<void | Error> => {},
  iamDeleteHandler: () => {},
  bearerUpdateHandler: async (
    request: UpdateCredentialsRequest,
  ): Promise<void | Error> => {},
  bearerDeleteHandler: () => {},
};

function clearHandlers() {
  authHandlers.iamUpdateHandler = async (
    request: UpdateCredentialsRequest,
  ): Promise<void | Error> => {};
  authHandlers.iamDeleteHandler = () => {};
  authHandlers.bearerUpdateHandler = async (
    request: UpdateCredentialsRequest,
  ): Promise<void | Error> => {};
  authHandlers.bearerDeleteHandler = () => {};
}

const serverLspConnectionMock = <Connection>{
  onRequest: (method: string, handler: any) => {
    if (method === credentialsProtocolMethodNames.iamCredentialsUpdate) {
      authHandlers.iamUpdateHandler = handler;
    }
    if (method === credentialsProtocolMethodNames.bearerCredentialsUpdate) {
      authHandlers.bearerUpdateHandler = handler;
    }
  },
  onNotification: (method: string, handler: any) => {
    if (method === credentialsProtocolMethodNames.iamCredentialsDelete) {
      authHandlers.iamDeleteHandler = handler;
    }
    if (method === credentialsProtocolMethodNames.bearerCredentialsDelete) {
      authHandlers.bearerDeleteHandler = handler;
    }
  },
  console: {
    info: (str: string) => {
      console.log(str);
    },
    log: (str: string) => {
      console.log(str);
    },
    error: (str: string) => {
      console.log(str);
    },
  },
};

const bearerCredentials: BearerCredentials = {
  token: "testToken",
};
const iamCredentials: IamCredentials = {
  accessKeyId: "testKey",
  secretAccessKey: "testSecret",
  sessionToken: "testSession",
};

const encryptionKey = randomBytes(32);

describe("Auth", () => {
  beforeEach(() => {
    clearHandlers();
  });

  it("Registers handlers for LSP credentials methods", async () => {
    const iamUpdateHandler = authHandlers.iamUpdateHandler;
    const iamDeleteHandler = authHandlers.iamDeleteHandler;
    const bearerUpdateHandler = authHandlers.bearerUpdateHandler;
    const bearerDeleteHandler = authHandlers.bearerDeleteHandler;

    new Auth(serverLspConnectionMock);

    assert(authHandlers.iamUpdateHandler !== iamUpdateHandler);
    assert(authHandlers.iamDeleteHandler !== iamDeleteHandler);
    assert(authHandlers.bearerUpdateHandler !== bearerUpdateHandler);
    assert(authHandlers.bearerDeleteHandler !== bearerDeleteHandler);
  });

  it("Handles IAM credentials", async () => {
    const updateRequest: UpdateCredentialsRequest = {
      data: iamCredentials,
      encrypted: false,
    };
    const auth = new Auth(serverLspConnectionMock);
    const credentialsProvider: CredentialsProvider =
      auth.getCredentialsProvider();

    assert(!credentialsProvider.hasCredentials("iam"));
    const response = await authHandlers.iamUpdateHandler(updateRequest);

    assert(credentialsProvider.hasCredentials("iam"));
    assert.deepEqual(credentialsProvider.getCredentials("iam"), iamCredentials);
    assert.ok(response);

    authHandlers.iamDeleteHandler();
    assert(!credentialsProvider.hasCredentials("iam"));
    assert(credentialsProvider.getCredentials("iam") === undefined);
  });

  it("Handles Bearer credentials", async () => {
    const updateRequest: UpdateCredentialsRequest = {
      data: bearerCredentials,
      encrypted: false,
    };
    const auth = new Auth(serverLspConnectionMock);
    const credentialsProvider: CredentialsProvider =
      auth.getCredentialsProvider();

    assert(!credentialsProvider.hasCredentials("bearer"));
    const response = await authHandlers.bearerUpdateHandler(updateRequest);

    assert(credentialsProvider.hasCredentials("bearer"));
    assert.deepEqual(
      credentialsProvider.getCredentials("bearer"),
      bearerCredentials,
    );
    assert.ok(response);

    authHandlers.bearerDeleteHandler();
    assert(!credentialsProvider.hasCredentials("bearer"));
    assert(credentialsProvider.getCredentials("bearer") === undefined);
  });

  it("Rejects when IAM credentials are invalid", async () => {
    const malformedIamCredentials = {
      accessKeyId: "testKey",
      sessionToken: "testSession",
    };
    const updateIamRequest: UpdateCredentialsRequest = {
      data: malformedIamCredentials as IamCredentials,
      encrypted: false,
    };
    const auth = new Auth(serverLspConnectionMock);
    const credentialsProvider: CredentialsProvider =
      auth.getCredentialsProvider();

    await assert.rejects(
      authHandlers.iamUpdateHandler(updateIamRequest),
      /Invalid IAM credentials/,
    );
    assert(!credentialsProvider.getCredentials("iam"));
  });

  it("Rejects when bearer credentials are invalid", async () => {
    const malformedBearerCredentials = {
      token: undefined as unknown,
    };
    const updateBearerRequest: UpdateCredentialsRequest = {
      data: malformedBearerCredentials as BearerCredentials,
      encrypted: false,
    };
    const auth = new Auth(serverLspConnectionMock);
    const credentialsProvider: CredentialsProvider =
      auth.getCredentialsProvider();

    await assert.rejects(
      authHandlers.bearerUpdateHandler(updateBearerRequest),
      /Invalid bearer credentials/,
    );
    assert(!credentialsProvider.getCredentials("bearer"));
  });

  describe("Credentials provider", () => {
    it("Prevents modifying IAM credentials object", async () => {
      const updateIamRequest: UpdateCredentialsRequest = {
        data: iamCredentials,
        encrypted: false,
      };
      const auth = new Auth(serverLspConnectionMock);
      const credentialsProvider: CredentialsProvider =
        auth.getCredentialsProvider();

      await authHandlers.iamUpdateHandler(updateIamRequest);

      let creds: any = credentialsProvider.getCredentials("iam");
      const initialAccessKey = creds.accessKeyId;

      assert.throws(
        () => (creds.accessKeyId = "anotherKey"),
        /Cannot assign to read only property/,
      );
      creds = {};
      assert(
        (credentialsProvider.getCredentials("iam") as IamCredentials)
          .accessKeyId === initialAccessKey,
      );
    });

    it("Prevents modifying Bearer credentials object", async () => {
      const updateBearerRequest: UpdateCredentialsRequest = {
        data: bearerCredentials,
        encrypted: false,
      };

      const auth = new Auth(serverLspConnectionMock);
      const credentialsProvider: CredentialsProvider =
        auth.getCredentialsProvider();

      await authHandlers.bearerUpdateHandler(updateBearerRequest);

      let creds: any = credentialsProvider.getCredentials("bearer");
      const initialToken = creds.token;
      assert.throws(
        () => (creds.token = "anotherToken"),
        /Cannot assign to read only property/,
      );
      creds = {};
      assert(
        (credentialsProvider.getCredentials("bearer") as BearerCredentials)
          .token === initialToken,
      );
    });

    it("Throws on unsupported type", async () => {
      const auth = new Auth(serverLspConnectionMock);
      const credentialsProvider: CredentialsProvider =
        auth.getCredentialsProvider();

      assert.throws(
        () =>
          credentialsProvider.hasCredentials(
            "unsupported_type" as CredentialsType,
          ),
        /Unsupported credentials type/,
      );
      assert.throws(
        () =>
          credentialsProvider.getCredentials(
            "unsupported_type" as CredentialsType,
          ),
        /Unsupported credentials type/,
      );
    });
  });

  describe("Encrypted credentials", () => {
    it("Rejects when encrypted flag is set wrong", async () => {
      const updateIamRequest: UpdateCredentialsRequest = {
        data: iamCredentials as IamCredentials,
        encrypted: true,
      };
      const auth = new Auth(serverLspConnectionMock);
      const credentialsProvider: CredentialsProvider =
        auth.getCredentialsProvider();

      await assert.rejects(
        authHandlers.iamUpdateHandler(updateIamRequest),
        /No encryption key/,
      );

      assert(!credentialsProvider.getCredentials("iam"));
    });

    it("Handles encrypted IAM credentials", async () => {
      const auth = new Auth(
        serverLspConnectionMock,
        encryptionKey.toString("base64"),
        "JWT",
      );
      const credentialsProvider: CredentialsProvider =
        auth.getCredentialsProvider();

      const payload = { data: iamCredentials };

      const jwt = await new jose.EncryptJWT(payload)
        .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
        .encrypt(encryptionKey);

      const updateIamRequest: UpdateCredentialsRequest = {
        data: jwt,
        encrypted: true,
      };
      await authHandlers.iamUpdateHandler(updateIamRequest);
      assert.deepEqual(
        credentialsProvider.getCredentials("iam"),
        iamCredentials,
      );
    });

    it("Handles encrypted bearer credentials", async () => {
      const auth = new Auth(
        serverLspConnectionMock,
        encryptionKey.toString("base64"),
        "JWT",
      );
      const credentialsProvider: CredentialsProvider =
        auth.getCredentialsProvider();

      const payload = { data: bearerCredentials };

      const jwt = await new jose.EncryptJWT(payload)
        .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
        .encrypt(encryptionKey);

      const updateBearerRequest: UpdateCredentialsRequest = {
        data: jwt,
        encrypted: true,
      };
      await authHandlers.bearerUpdateHandler(updateBearerRequest);
      assert.deepEqual(
        credentialsProvider.getCredentials("bearer"),
        bearerCredentials,
      );
    });

    it("Rejects if encryption algorithm is not direct A256GCM", async () => {
      const auth = new Auth(
        serverLspConnectionMock,
        encryptionKey.toString("base64"),
        "JWT",
      );
      const credentialsProvider: CredentialsProvider =
        auth.getCredentialsProvider();

      const payload = { data: bearerCredentials };

      const jwt = await new jose.EncryptJWT(payload)
        .setProtectedHeader({ alg: "dir", enc: "A128CBC-HS256" })
        .encrypt(encryptionKey);

      const updateBearerRequest: UpdateCredentialsRequest = {
        data: jwt,
        encrypted: true,
      };
      await assert.rejects(
        authHandlers.bearerUpdateHandler(updateBearerRequest),
        /Header Parameter not allowed/,
      );
      assert(!credentialsProvider.getCredentials("bearer"));
    });

    it("Verifies JWT claims", async () => {
      const auth = new Auth(
        serverLspConnectionMock,
        encryptionKey.toString("base64"),
        "JWT",
      );
      const credentialsProvider: CredentialsProvider =
        auth.getCredentialsProvider();

      const payload = { data: bearerCredentials };

      const jwt = await new jose.EncryptJWT(payload)
        .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
        .setNotBefore(new Date().getTime() / 1000 + 50) //allows up to 60s clockTolerance
        .setExpirationTime(new Date().getTime() / 1000 - 70) //not allowed
        .encrypt(encryptionKey);

      const updateBearerRequest: UpdateCredentialsRequest = {
        data: jwt,
        encrypted: true,
      };
      await assert.rejects(
        authHandlers.bearerUpdateHandler(updateBearerRequest),
        /"exp" claim timestamp check failed/,
      );
      assert(!credentialsProvider.getCredentials("bearer"));
    });
  });
});
