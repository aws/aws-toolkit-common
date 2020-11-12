/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { argv } from 'yargs'
import * as path from 'path'
import * as _ from 'lodash'
import { CommandLineArguments } from './parser'
import { generate } from './generate'

function parseArguments(): CommandLineArguments {
    let input: string[] = []
    if (!argv.output) {
        console.log("Argument 'output' required")
        throw undefined
    }
    if (argv.extraInput) {
        input = (argv.extraInput as string).split(',').map(item => item.trim())
    }

    // Always append the global definitions
    input.push(path.join(__dirname, 'commonDefinitions.json'))
    input.push(path.join(__dirname, 'vscodeDefinitions.json'))

    return {
        inputFiles: input,
        outputFile: argv.output as string,
    }
}

// main run, parse input then generate
;(async () => {
    const args = parseArguments()
    await generate(args)
})()
