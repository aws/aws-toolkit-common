/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync, writeFileSync } from 'fs-extra'
import { spawnSync } from 'child_process'
import { argv } from 'yargs'
import * as Ajv from 'ajv'
import * as path from 'path'

interface CommandLineArguments {
    inputFiles: string[]
    outputFile: string
}

interface MetadataType {
    name: string
    type?: string
    allowedValues?: string[] | number[]
    description: string
}

interface MetricMetadataType extends MetadataType {
    required: boolean
}

interface MetricMetadata {
    type: string
    required?: boolean
}

interface Metric {
    name: string
    description: string
    unit: string
    metadata: MetricMetadata[]
}

// converts snake_case to CamelCase. E.x. lambda_invoke => LambdaInvoke
function metricToTypeName(m: Metric): string {
    return m.name
        .split('_')
        .map(item => item.replace(item[0], item[0].toUpperCase()))
        .join('')
}

interface MetricDefinitionRoot {
    types: MetadataType[]
    metrics: Metric[]
}

function globalArgs(): string[] {
    return [
        '// The time that the event took place',
        'createTime?: Date',
        '// Value based on unit and call type',
        'value?: number'
    ]
}

function isNumberArray(a?: any[]): boolean {
    if (!Array.isArray(a)) {
        return false
    }

    return !isNaN(Number(a?.[0]))
}

function getArgsFromMetadata(m: MetricMetadataType): string {
    let t = m.name
    if ((m?.allowedValues?.length ?? 0) === 0) {
        switch (m.type) {
            case undefined:
                t = 'string'
                break
            case 'string':
                t = 'string'
                break
            case 'double':
            case 'int':
                t = 'number'
                break
            case 'boolean':
                t = 'boolean'
                break
            default: {
                console.log(`unkown type ${m?.type} in metadata ${m.name}`)
                throw undefined
            }
        }
    }

    return `${m.name}${m.required ? '' : '?'}: ${t}`
}

function parseInput(s: string): MetricDefinitionRoot {
    try {
        const schemaInput = readFileSync(path.join(__dirname, 'telemetrySchema.json'), 'utf8')
        const schema = JSON.parse(schemaInput)
        const jsonValidator = new Ajv().compile(schema)
        const fileInput = readFileSync(s, 'utf8')
        const input = JSON.parse(fileInput)
        const valid = jsonValidator(input)
        if(!valid) {
            console.error("validating schema failed!")
            console.error(jsonValidator.errors)
            throw undefined
        }
        return  input as MetricDefinitionRoot
    } catch (errors) {
        console.error(`Error while trying to parse the definitions file ${errors}`)
        throw undefined
    }
}

function generateTelemetry(telemetryJson: MetricDefinitionRoot): string {
    const metadataTypes = telemetryJson.types
    const metrics = telemetryJson.metrics
    let str = ''

    metadataTypes.forEach((m: MetadataType) => {
        if ((m?.allowedValues?.length ?? 0) === 0) {
            return
        }
        let values: string = ''
        if (isNumberArray(m.allowedValues)) {
            values = (m.allowedValues as number[])!.join(' | ')
        } else {
            values = (m.allowedValues as string[])!.map((item: string) => `'${item}'`).join(' | ')
        }

        str += `type ${m.name} = ${values}\n`
    })

    metrics.forEach((metric: Metric) => {
        const metadata: MetricMetadataType[] = metric.metadata.map((item: MetricMetadata) => {
            const foundMetadata: MetadataType | undefined = metadataTypes.find(
                (candidate: MetadataType) => candidate.name === item.type
            )
            if (!foundMetadata) {
                console.log(`Metric ${metric.name} references metadata ${item.type} that is not found!`)
                throw undefined
            }

            return {
                ...foundMetadata,
                required: item.required ?? true
            }
        })

        const name = metricToTypeName(metric)
        str += `interface ${name} {
    ${metadata.map(item => `\n// ${item.description}\n${getArgsFromMetadata(item)}`).join(',')}
    ${globalArgs().join(',\n')}
}`

        str += `\n/**
      * ${metric.description}
      * @param args See the ${name} interface
      * @returns Nothing
      */\n`

        str += `export function record${name}(args${metadata.every(item => !item.required) ? '?' : ''}: ${name}) {
    ext.telemetry.record({
            createTime: args?.createTime ?? new Date(),
            data: [{
                MetricName: '${metric.name}',
                Value: args?.value ?? 1,
                Unit: '${metric.unit}',
                Metadata: [${metadata.map(
                    (item: MetadataType) => `{Key: '${item.name}', Value: args.${item.name}?.toString() ?? ''}`
                )}]
            }]
        })
}`
    })

    return str
}

function generateHelperFunctions(): string {
    return `
export function millisecondsSince(d: Date): number {
    return Date.now() - Number(d)
}
`
}

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
    const input: MetricDefinitionRoot = args.inputFiles.map(parseInput).reduce(
        (item: MetricDefinitionRoot, input: MetricDefinitionRoot) => {
            item.metrics.push(...input.metrics)
            item.types.push(...input.types)
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
