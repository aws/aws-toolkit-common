import { fieldSort, metricSort } from './sorting'
import { TelemetryDefinitions } from './telemetryDefinitions'

export function reorder(definitions: TelemetryDefinitions): void {
    orderTypes(definitions)
    orderMetrics(definitions)
}

function orderTypes(definitions: TelemetryDefinitions): void {
    definitions.types.sort(fieldSort)
}

function orderMetrics(definitions: TelemetryDefinitions): void {
    definitions.metrics.sort(metricSort)
}
