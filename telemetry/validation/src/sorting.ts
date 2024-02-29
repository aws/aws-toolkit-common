import { Metric, TelemetryField } from './telemetryDefinitions'

export function fieldSort(a: TelemetryField, b: TelemetryField): number {
    return a.name.localeCompare(b.name)
}

export function metricSort(a: Metric, b: Metric): number {
    return a.name.localeCompare(b.name)
}

export function stringSort(a: string, b: string): number {
    return a.localeCompare(b)
}
