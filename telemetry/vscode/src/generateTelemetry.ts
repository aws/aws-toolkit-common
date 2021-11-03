/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { argv } from 'yargs'
import * as path from 'path'
import * as _ from 'lodash'
import { CommandLineArguments } from './parser'
import { generate } from './generate'

async function parseArguments(): Promise<CommandLineArguments> {
    let input: string[] = []

    const args = await argv 

    if (!args.output) {
        console.log("Argument 'output' required")
        throw undefined
    }
    if (args.extraInput) {
        input = (args.extraInput as string).split(',').map(item => item.trim())
    }

    // Always append the global definitions
    input.push(path.join(__dirname, 'commonDefinitions.json'))
    input.push(path.join(__dirname, 'vscodeDefinitions.json'))

    return {
        inputFiles: input,
        outputFile: args.output as string,
    }
}

// main run, parse input then generate
;(async () => {
    const args = await parseArguments()
    await generate(args)
})()
