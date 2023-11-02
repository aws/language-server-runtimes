import assert from "assert";
import { metric } from "./telemetry";

describe("Telemetry", () => {
  it("creates metric with minimal fields", async () => {
    const metricName = "test";
    const testMetric = metric(metricName);

    assert(testMetric);
    assert.deepEqual(testMetric.name, metricName);
  });

  it("creates metric with arbitrary data field", async () => {
    const metricName = "test";
    const metricData = {
      processId: 123,
      sessionId: "asdf1234",
    };
    const testMetric = metric(metricName, metricData);

    assert(testMetric);
    assert.deepEqual(testMetric.name, metricName);
    assert.deepEqual(testMetric.data, metricData);
  });
});
