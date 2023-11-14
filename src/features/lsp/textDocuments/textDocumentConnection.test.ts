import assert from "assert";
import {
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  DidOpenTextDocumentParams,
  DidSaveTextDocumentParams,
  NotificationHandler,
  WillSaveTextDocumentParams,
} from "vscode-languageserver";
import { TextDocumentConnection } from "vscode-languageserver/lib/common/textDocuments";
import { observe } from "./textDocumentConnection";

const handlers = {
  onDidOpenTextDocument: undefined as NotificationHandler<any> | undefined,
  onDidChangeTextDocument: undefined as NotificationHandler<any> | undefined,
  onDidCloseTextDocument: undefined as NotificationHandler<any> | undefined,
  onWillSaveTextDocument: undefined as NotificationHandler<any> | undefined,
  onDidSaveTextDocument: undefined as NotificationHandler<any> | undefined,
};

const testConnection: TextDocumentConnection = {
  onDidOpenTextDocument: (
    handler: NotificationHandler<DidOpenTextDocumentParams>,
  ) => {
    handlers.onDidOpenTextDocument = handler;
    return { dispose: () => {} };
  },
  onDidChangeTextDocument: (
    handler: NotificationHandler<DidChangeTextDocumentParams>,
  ) => {
    handlers.onDidChangeTextDocument = handler;
    return { dispose: () => {} };
  },
  onDidCloseTextDocument: (
    handler: NotificationHandler<DidCloseTextDocumentParams>,
  ) => {
    handlers.onDidCloseTextDocument = handler;
    return { dispose: () => {} };
  },
  onWillSaveTextDocument: (
    handler: NotificationHandler<WillSaveTextDocumentParams>,
  ) => {
    handlers.onWillSaveTextDocument = handler;
    return { dispose: () => {} };
  },
  onDidSaveTextDocument: (
    handler: NotificationHandler<DidSaveTextDocumentParams>,
  ) => {
    handlers.onDidSaveTextDocument = handler;
    return { dispose: () => {} };
  },
  onWillSaveTextDocumentWaitUntil: () => ({ dispose: () => {} }),
};

describe("TextDocumentConnection", () => {
  let calledFirst = false;
  let calledSecond = false;
  beforeEach(() => {
    calledFirst = false;
    calledSecond = false;

    Object.keys(handlers).forEach(
      (k) => (handlers[k as keyof typeof handlers] = undefined),
    );
  });

  describe("without observable (baseline)", () => {
    Object.keys(handlers).forEach((key) => {
      it(key + " only supports the last callback", () => {
        testConnection[key as keyof typeof handlers](() => {
          calledFirst = true;
        });
        testConnection[key as keyof typeof handlers](
          () => (calledSecond = true),
        );

        handlers[key as keyof typeof handlers]!({});

        assert.equal(calledFirst, false);
        assert.equal(calledSecond, true);
      });
    });
  });

  describe("with observable", () => {
    Object.keys(handlers).forEach((key) => {
      let observableConnection: ReturnType<typeof observe>;

      beforeEach(async () => {
        observableConnection = observe(testConnection);
      });

      it(key + " supports multiple subscriptions", () => {
        observableConnection[key as keyof typeof handlers].subscribe(() => {
          calledFirst = true;
        });
        observableConnection[key as keyof typeof handlers].subscribe(
          () => (calledSecond = true),
        );

        handlers[key as keyof typeof handlers]!({});

        assert.equal(calledFirst, true);
        assert.equal(calledSecond, true);
      });

      it(key + " supports unsubscribe and resubscribe", () => {
        const sub = observableConnection[
          key as keyof typeof handlers
        ].subscribe(() => {
          calledFirst = true;
        });
        sub.unsubscribe();
        observableConnection[key as keyof typeof handlers].subscribe(
          () => (calledSecond = true),
        );

        handlers[key as keyof typeof handlers]!({});

        assert.equal(calledFirst, false);
        assert.equal(calledSecond, true);
      });

      it(key + " supports callbacks", () => {
        observableConnection.callbacks[key as keyof typeof handlers](() => {
          calledFirst = true;
        });
        observableConnection.callbacks[key as keyof typeof handlers](() => {
          calledSecond = true;
        });

        handlers[key as keyof typeof handlers]!({});

        assert.equal(calledFirst, true);
        assert.equal(calledSecond, true);
      });

      it(key + " supports callback dispose", () => {
        const disposable = observableConnection.callbacks[
          key as keyof typeof handlers
        ](() => {
          calledFirst = true;
        });
        observableConnection.callbacks[key as keyof typeof handlers](() => {
          calledSecond = true;
        });

        disposable.dispose();

        handlers[key as keyof typeof handlers]!({});

        assert.equal(calledFirst, false);
        assert.equal(calledSecond, true);
      });
    });
  });
});
