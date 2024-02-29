import { reorder } from './reorder'
import { TelemetryDefinitions, loadTelemetryDefinitions, saveTelemetryDefinitions } from './telemetryDefinitions'

/**
 * Performs automated fixes for certain validation checks on the given file.
 * To use: call this script with the json file to fix
 * "node fix.js foo.json"
 */
async function main() {
    if (process.argv.length < 3) {
        throw new Error('args is missing the file to validate')
    }

    const jsonPath = process.argv[2]
    const definitions = await loadTelemetryDefinitions(jsonPath)

    fix(definitions)

    await saveTelemetryDefinitions(definitions, jsonPath)
}

export function fix(definitions: TelemetryDefinitions): void {
    reorder(definitions)
}

;(async () => {
    await main()
})()
