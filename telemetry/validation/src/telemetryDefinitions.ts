import * as fs from 'fs/promises'

export interface TelemetryField {
    name: string
    // there are other fields not used by this scripting
}

export interface Metric {
    name: string
    // there are other fields not used by this scripting
}

/**
 * Outermost representation of telemetry definitions file
 * (telemetry/definitions/commonDefinitions.json)
 * This isn't intended to be the official format spec (see telemetry/telemetrySchema.json),
 * it is 'just enough' to use in scripts.
 */
export interface TelemetryDefinitions {
    types: TelemetryField[]
    metrics: Metric[]
}

export async function loadTelemetryDefinitions(path: string): Promise<TelemetryDefinitions> {
    const json = await fs.readFile(path, {
        encoding: 'utf8'
    })

    return JSON.parse(json) as TelemetryDefinitions
}

export async function saveTelemetryDefinitions(definitions: TelemetryDefinitions, path: string): Promise<void> {
    const json = JSON.stringify(definitions, undefined, 4)
    await fs.writeFile(path, json, {
        encoding: 'utf8'
    })
}

/**
 * Re-arranges the types and metrics arrays in alphabetical order
 */
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

/**
 * Performs validation checks on the given telemetry definitions
 * Returns a collection of detected validation problems.
 */
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

function fieldSort(a: TelemetryField, b: TelemetryField): number {
    return a.name.localeCompare(b.name)
}

function metricSort(a: Metric, b: Metric): number {
    return a.name.localeCompare(b.name)
}

function stringSort(a: string, b: string): number {
    return a.localeCompare(b)
}
