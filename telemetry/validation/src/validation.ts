import { stringSort } from './sorting'
import { TelemetryDefinitions } from './telemetryDefinitions'

export function validate(definitions: TelemetryDefinitions): string[] {
    const validations: string[] = []

    validations.push(...validateTypeOrder(definitions))
    validations.push(...validateMetricsOrder(definitions))

    return validations
}

function validateTypeOrder(definitions: TelemetryDefinitions): string[] {
    const validations = []

    const sortedNames = definitions.types.map(t => t.name).sort(stringSort)

    for (let i = 0; i < definitions.types.length; i++) {
        const inputType = definitions.types[i]
        const sortedName = sortedNames[i]

        if (inputType.name != sortedName) {
            validations.push(`Telemetry Types are not sorted. Expected: ${sortedName}, Found: ${inputType.name}`)
            break
        }
    }

    return validations
}

function validateMetricsOrder(definitions: TelemetryDefinitions): string[] {
    const validations = []

    const sortedNames = definitions.metrics.map(t => t.name).sort(stringSort)

    for (let i = 0; i < definitions.metrics.length; i++) {
        const inputMetric = definitions.metrics[i]
        const sortedName = sortedNames[i]

        if (inputMetric.name != sortedName) {
            validations.push(`Telemetry Metrics are not sorted. Expected: ${sortedName}, Found: ${inputMetric.name}`)
            break
        }
    }

    return validations
}
