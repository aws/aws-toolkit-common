import * as fs from 'fs/promises'

export interface TelemetryField {
    name: string
    // there are other fields not used by this scripting
}

export interface Metric {
    name: string
    // there are other fields not used by this scripting
}

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
