/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync, writeFileSync } from 'fs-extra'
import * as jsonParser from 'jsonc-parser'
// This is defined as a DevDependency
// tslint:disable-next-line: no-implicit-dependencies
import { argv } from 'yargs'

interface commandLineArguments {
    input: string
    output: string
}

type AllowedTypes = 'string' | 'int' | 'double' | 'boolean'
type MetricType = 'Milliseconds' | 'Bytes' | 'Percent' | 'Count' | 'None'

interface MetadataType {
    name: string
    type?: AllowedTypes
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
    unit: MetricType
    metadata: MetricMetadata[]
}

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
    const file = readFileSync(s, 'utf8')
    const errors: jsonParser.ParseError[] = []
    const jsonOutput = jsonParser.parse(file, errors) as MetricDefinitionRoot

    if (errors.length > 0) {
        console.error(`Errors while trying to parse the definitions file ${errors.join('\n')}`)
        throw undefined
    }

    return jsonOutput
}

function generateTelemetry(telemetryJson: MetricDefinitionRoot): string {
    const metadatum = telemetryJson.types
    const metrics = telemetryJson.metrics
    let str = ''

    metadatum.forEach((m: MetadataType) => {
        if ((m?.allowedValues?.length ?? 0) === 0) {
            return
        }
        let values: string = ''
        if (isNumberArray(m.allowedValues)) {
            values = (m.allowedValues as number[])!.join(' | ')
        } else {
            values = (m.allowedValues as string[])!.map((item: string) => `'${item}'`).join(' | ')
        }

        str += `export type ${m.name} = ${values}\n`
    })

    metrics.forEach((metric: Metric) => {
        const metadata: MetricMetadataType[] = metric.metadata.map((item: MetricMetadata) => {
            const foundMetadata: MetadataType | undefined = metadatum.find(
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

function parseArguments(): commandLineArguments {
    if (!argv.output) {
        console.log("Argument 'output' required")
        throw undefined
    }
    if (!argv.input) {
        console.log("Argument 'input' required")
        throw undefined
    }

    return {
        input: argv.input as string,
        output: argv.output as string
    }
}

// Generate
;(() => {
    let output = `
    /*!
     * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
     * SPDX-License-Identifier: Apache-2.0
     */

    import { ext } from '../extensionGlobals'
    `

    const args = parseArguments()
    const input: MetricDefinitionRoot = parseInput(args.input)
    output += generateTelemetry(input)
    output += generateHelperFunctions()

    writeFileSync(args.output, output)

    console.log('Done generating, formatting!')
})()
