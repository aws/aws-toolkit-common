/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { writeFileSync } from 'fs'
import { spawnSync } from 'child_process'
import { argv } from 'yargs'
import * as path from 'path'
import { CommandLineArguments, MetricDefinitionRoot, validateInput } from './parser'
import { generateTelemetry, generateHelperFunctions } from './generate'

function parseArguments(): CommandLineArguments {
    let input: string[] = []
    if (!argv.output) {
        console.log("Argument 'output' required")
        throw undefined
    }
    if (argv.input) {
        input = (argv.input as string).split(',').map(item => item.trim())
    }

    // Always append the global definitions
    input.push(path.join(__dirname, 'telemetryDefinitions.json'))

    return {
        inputFiles: input,
        outputFile: argv.output as string
    }
}

function formatOutput(output: string) {
    try {
        spawnSync('npx', ['prettier', '--write', output])
    } catch (e) {
        console.warn(`Unable to run prettier on output ${e}`)
    }
}

// Generate
;(() => {
    let output = `
    /*!
     * Copyright ${new Date().getUTCFullYear()} Amazon.com, Inc. or its affiliates. All Rights Reserved.
     * SPDX-License-Identifier: Apache-2.0
     */

    import { ext } from '../extensionGlobals'
    `

    const args = parseArguments()
    const input: MetricDefinitionRoot = args.inputFiles.map(validateInput).reduce(
        (item: MetricDefinitionRoot, input: MetricDefinitionRoot) => {
            item.types!.push(...input.types ?? [])
            item.metrics.push(...input.metrics)
            return item
        },
        { types: [], metrics: [] }
    )
    output += generateTelemetry(input)
    output += generateHelperFunctions()

    writeFileSync(args.outputFile, output)

    console.log('Done generating, formatting!')

    formatOutput(args.outputFile)
})()
