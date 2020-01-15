/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'fs-extra'
import * as Ajv from 'ajv'
import * as path from 'path'

export interface CommandLineArguments {
    inputFiles: string[]
    outputFile: string
}

export interface MetadataType {
    name: string
    type?: string
    allowedValues?: string[] | number[]
    description: string
}

export interface MetricMetadataType extends MetadataType {
    required: boolean
}

export interface MetricMetadata {
    type: string
    required?: boolean
}

export interface Metric {
    name: string
    description: string
    unit: string
    metadata: MetricMetadata[]
}
export interface MetricDefinitionRoot {
    types?: MetadataType[]
    metrics: Metric[]
}

export function validateInput(inputFile: string): MetricDefinitionRoot {
    try {
        const schemaInput = readFileSync(path.join(__dirname, '../lib/telemetrySchema.json'), 'utf8')
        const schema = JSON.parse(schemaInput)
        const jsonValidator = new Ajv().compile(schema)
        const fileInput = readFileSync(inputFile, 'utf8')
        const input = JSON.parse(fileInput)
        const valid = jsonValidator(input)
        if (!valid) {
            console.error('validating schema failed!')
            throw jsonValidator.errors
        }
        return input as MetricDefinitionRoot
    } catch (errors) {
        console.error(`Error while trying to parse the definitions file: ${errors}`)
        throw undefined
    }
}
