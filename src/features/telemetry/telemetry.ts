export type Metric = {
  name: string;
};

export type MetricEvent = Metric & {
  data?: any;
  result?: ResultType;
  errorData?: ErrorData;
};

export type BusinessMetricEvent = Metric & {
  // TODO: define more
};

type ResultType = "Succeeded" | "Failed" | "Cancelled";

type ErrorData = {
  reason: string;
  errorCode?: string;
  httpStatusCode?: number;
};

export const metric = (
  name: string,
  data?: any,
  result?: ResultType,
  errorData?: ErrorData,
): MetricEvent => ({
  name,
  data,
});

/**
 * The telemetry feature interface.
 */
export type Telemetry = {
  emitMetric: (metric: MetricEvent) => void;
};
