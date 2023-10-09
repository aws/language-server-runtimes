import assert from "assert";
import sinon, { SinonStub } from "sinon";
import { handleVersionArgument } from "./versioning";

describe("handleVersionArgument", () => {
  let processExitStub: SinonStub;
  let consoleLogStub: SinonStub;
  const version = "1.0.0";

  beforeEach(() => {
    processExitStub = sinon.stub(process, "exit");
    consoleLogStub = sinon.stub(console, "log");
  });

  afterEach(() => {
    processExitStub.restore();
    consoleLogStub.restore();
  });

  it("should log the version and exit when --version is in process.argv", () => {
    process.argv = ["node", "script.js", "--version"];

    handleVersionArgument(version);

    assert.strictEqual(consoleLogStub.calledOnceWithExactly(version), true);
    assert.strictEqual(processExitStub.calledOnceWithExactly(0), true);
  });

  it("should log the version and exit when -v is in process.argv", () => {
    process.argv = ["node", "script.js", "-v"];

    handleVersionArgument(version);

    assert.strictEqual(consoleLogStub.calledOnceWithExactly(version), true);
    assert.strictEqual(processExitStub.calledOnceWithExactly(0), true);
  });

  it("should do nothing when neither --version nor -v is in process.argv", () => {
    process.argv = ["node", "script.js", "--stdio"];

    handleVersionArgument(version);

    assert.strictEqual(consoleLogStub.called, false);
    assert.strictEqual(processExitStub.called, false);
  });
});
