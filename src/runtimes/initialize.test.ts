import {
  CancellationToken,
  InitializeError,
  InitializeParams,
  InitializeResult,
  ResponseError,
  TextDocumentSyncKind,
} from "vscode-languageserver";
import { InitializeHandler } from "./initialize";
import assert from "assert";

describe("InitializeHandler", () => {
  let initializeHandler: InitializeHandler;

  beforeEach(() => {
    initializeHandler = new InitializeHandler("AWS LSP Standalone", "1.0.0");
  });

  it("should store InitializeParam in a field", () => {
    const initParam = {} as InitializeParams;
    initializeHandler.onInitialize(initParam, {} as CancellationToken);
    assert(initializeHandler.clientInitializeParams === initParam);
  });

  it("should return the default response when no handlers are registered", async () => {
    const result = await initializeHandler.onInitialize(
      {} as InitializeParams,
      {} as CancellationToken,
    );

    const expected = {
      serverInfo: {
        name: "AWS LSP Standalone",
        version: "1.0.0",
      },
      capabilities: {
        textDocumentSync: {
          openClose: true,
          change: TextDocumentSyncKind.Incremental,
        },
        hoverProvider: true,
      },
    };
    assert.deepStrictEqual(result, expected);
  });

  it("should merge handler results with the default response", async () => {
    const handler1 = () => {
      return {
        capabilities: {
          completionProvider: { resolveProvider: true },
        },
      };
    };
    const handler2 = () => {
      return Promise.resolve({
        capabilities: {
          hoverProvider: true,
        },
        extraField: "extraValue",
      });
    };

    initializeHandler.addHandler(handler1);
    initializeHandler.addHandler(handler2);

    const result = await initializeHandler.onInitialize(
      {} as InitializeParams,
      {} as CancellationToken,
    );

    const expected: InitializeResult = {
      serverInfo: {
        name: "AWS LSP Standalone",
        version: "1.0.0",
      },
      capabilities: {
        textDocumentSync: {
          openClose: true,
          change: TextDocumentSyncKind.Incremental,
        },
        completionProvider: { resolveProvider: true },
        hoverProvider: true,
      },
      extraField: "extraValue",
    };

    assert.deepStrictEqual(result, expected);
  });

  it("should prioritize the response of the handler that comes first", async () => {
    const handler1 = () => {
      return {
        capabilities: {
          completionProvider: { resolveProvider: true },
        },
      };
    };
    const handler2 = () => {
      return Promise.resolve({
        capabilities: {
          completionProvider: { resolveProvider: false },
        },
      });
    };

    initializeHandler.addHandler(handler1);
    initializeHandler.addHandler(handler2);

    const result = await initializeHandler.onInitialize(
      {} as InitializeParams,
      {} as CancellationToken,
    );

    const expected: InitializeResult = {
      serverInfo: {
        name: "AWS LSP Standalone",
        version: "1.0.0",
      },
      capabilities: {
        textDocumentSync: {
          openClose: true,
          change: TextDocumentSyncKind.Incremental,
        },
        completionProvider: { resolveProvider: true },
        hoverProvider: true,
      },
    };

    assert.deepStrictEqual(result, expected);
  });

  it("should return error if any of the handlers failed", async () => {
    const handler1 = () => {
      return {
        capabilities: {
          completionProvider: { resolveProvider: true },
        },
      };
    };
    const error = new ResponseError(111, "failed", { retry: false });
    const handler2 = (): Promise<ResponseError<InitializeError>> => {
      return Promise.resolve(error);
    };

    initializeHandler.addHandler(handler1);
    initializeHandler.addHandler(handler2);

    const result = await initializeHandler.onInitialize(
      {} as InitializeParams,
      {} as CancellationToken,
    );

    assert.deepStrictEqual(result, error);
  });
});
