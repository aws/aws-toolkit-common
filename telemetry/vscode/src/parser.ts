/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'fs-extra'
import * as Ajv from 'ajv'
import * as path from 'path'

export interface CommandLineArguments {
    readonly inputFiles: string[]
    readonly outputFile: string
}

export interface MetadataType {
    readonly name: string
    readonly type?: string
    readonly allowedValues?: string[] | number[]
    readonly description: string
}

export interface MetricMetadataType extends MetadataType {
    readonly required: boolean
}

export interface MetricMetadata {
    readonly type: string
    readonly required?: boolean
}

export interface Metric {
    readonly name: string
    readonly description: string
    readonly unit?: string
    readonly metadata?: MetricMetadata[]
    readonly passive?: boolean
    readonly trackPerformance?: boolean
}

export interface MetricDefinitionRoot {
    readonly types?: MetadataType[]
    readonly metrics: Metric[]
}

export function validateInput(fileText: string, fileName: string): MetricDefinitionRoot {
    try {
        const schemaInput = readFileSync(path.join(__dirname, '../lib/telemetrySchema.json'), 'utf8')
        const schema = JSON.parse(schemaInput)
        const jsonValidator = new Ajv().compile(schema)
        const input = JSON.parse(fileText)
        const valid = jsonValidator(input)
        if (!valid) {
            throw jsonValidator.errors
        }
        return input as MetricDefinitionRoot
    } catch (errors) {
        const msg = `Failed to parse definitions file ${fileName}: ${JSON.stringify(errors)}`
        throw new Error(msg)
    }
}
