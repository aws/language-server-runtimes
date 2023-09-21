// TODO: implement the richer Metric type to support more complex values and dimensions
export type Metric = {
  name: string;
  value: number;
};

export const metric = (name: string, value: number): Metric => ({
  name,
  value,
});

/**
 * The telemetry feature interface.
 *
 * TODO: define the {Metric} type.
 */
export type Telemetry = {
  emit: (metric: Metric) => void;
};
