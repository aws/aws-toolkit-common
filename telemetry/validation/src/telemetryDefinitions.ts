import * as fs from 'fs/promises'

export interface TelemetryField {
    name: string
    // there are other fields not used by this scripting
}

export interface MetricMetadata {
    type: string
}

export interface Metric {
    name: string
    metadata?: MetricMetadata[]
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
    orderMetricsMetadata(definitions)
}

function orderTypes(definitions: TelemetryDefinitions): void {
    definitions.types.sort(fieldSort)
}

function orderMetrics(definitions: TelemetryDefinitions): void {
    definitions.metrics.sort(metricSort)
}

function orderMetricsMetadata(definitions: TelemetryDefinitions): void {
    definitions.metrics
        .filter(x => x.metadata !== undefined)
        .forEach(metric => {
            metric.metadata!.sort(metricMetadataSort)
        })
}

/**
 * Performs validation checks on the given telemetry definitions
 * Returns a collection of detected validation problems.
 */
export function validate(definitions: TelemetryDefinitions): string[] {
    const validations: string[] = []

    validations.push(...validateTypeOrder(definitions))
    validations.push(...validateMetricsOrder(definitions))
    validations.push(...validateMetricsMetadataOrder(definitions))

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

function validateMetricsMetadataOrder(definitions: TelemetryDefinitions): string[] {
    const validations = []

    for (const metric of definitions.metrics) {
        if (metric.metadata === undefined) {
            continue
        }

        const sortedNames = metric.metadata.map(t => t.type).sort(stringSort)

        for (let i = 0; i < metric.metadata.length; i++) {
            const inputMetadata = metric.metadata[i]
            const sortedName = sortedNames[i]

            if (inputMetadata.type != sortedName) {
                validations.push(
                    `Telemetry Metric ${metric.name} has unsorted metadata. Expected: ${sortedName}, Found: ${inputMetadata.type}`
                )
                break
            }
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

function metricMetadataSort(a: MetricMetadata, b: MetricMetadata): number {
    return a.type.localeCompare(b.type)
}

function stringSort(a: string, b: string): number {
    return a.localeCompare(b)
}
