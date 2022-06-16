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
    passive: boolean
}
export interface MetricDefinitionRoot {
    types?: MetadataType[]
    metrics: Metric[]
}

export function validateInput(fileText: string, fileName: string): MetricDefinitionRoot {
    try {
        const schemaInput = readFileSync(path.join(__dirname, '../lib/telemetrySchema.json'), 'utf8')
        const schema = JSON.parse(schemaInput)
        const jsonValidator = new Ajv().compile(schema)
        const input = JSON.parse(fileText)
        const valid = jsonValidator(input)
        if (!valid) {
            console.error('validating schema failed!')
            throw jsonValidator.errors
        }
        return input as MetricDefinitionRoot
    } catch (errors) {
        console.error(`Error while trying to parse the definitions file ${fileName}: ${JSON.stringify(errors)}`)
        throw Error('Failed to parse')
    }
}
