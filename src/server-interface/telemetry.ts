export type Metric = {
    name: string
}

export type MetricEvent = Metric & {
    data?: any
    result?: ResultType
    errorData?: ErrorData
}

export type BusinessMetricEvent = Metric & {
    // TODO: define more
}

type ResultType = 'Succeeded' | 'Failed' | 'Cancelled'

type ErrorData = {
    reason: string
    errorCode?: string
    httpStatusCode?: number
}

/**
 * The telemetry feature interface.
 */
export type Telemetry = {
    emitMetric: (metric: MetricEvent) => void
}
