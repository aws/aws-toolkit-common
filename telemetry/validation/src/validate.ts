import { loadTelemetryDefinitions, validate } from './telemetryDefinitions'

/**
 * Performs validation checks on the given file.
 * To use: call this script with the json file to validate
 * "node validate.js foo.json"
 * This script will throw an Error if there are any validation failures.
 * Pass or fail, details will be written to the console.
 */
async function main() {
    if (process.argv.length < 3) {
        throw new Error('args is missing the file to validate')
    }

    const jsonPath = process.argv[2]
    const definitions = await loadTelemetryDefinitions(jsonPath)

    const validations = validate(definitions)

    if (validations.length > 0) {
        console.log(`❌ Validation checks fail (hint: "npm run fix"): ${jsonPath}`)
        validations.forEach(v => console.log(`- ${v}`))
        console.log()

        throw new Error('Validation failed. Run `npm run fix` to fix issues.')
    } else {
        console.log(`✅ Validation checks pass: ${jsonPath}`)
    }
}

;(async () => {
    await main()
})()
