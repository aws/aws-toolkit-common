/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFile, readFileSync, writeFileSync } from 'fs-extra'
import _ = require('lodash')
import {
    MetadataType,
    MetricMetadataType,
    MetricMetadata,
    Metric,
    MetricDefinitionRoot,
    CommandLineArguments,
    validateInput,
} from './parser'
import * as prettier from 'prettier'

function toTitleCase(s: string): string {
    return s.replace(s[0], s[0].toUpperCase())
}

// converts snake_case to PascalCase. E.x. lambda_invoke => LambdaInvoke
function metricToTypeName(m: Metric): string {
    return m.name.split('_').map(toTitleCase).join('')
}

function globalArgs(): string[] {
    return [
        '// The time that the event took place',
        'createTime?: Date',
        '// Value based on unit and call type',
        'value?: number',
        '// Whether the metric is not explicitly called by the user',
        'passive?: boolean'
    ]
}

function isNumberArray(a?: any[]): boolean {
    if (!Array.isArray(a)) {
        return false
    }

    return !isNaN(Number(a?.[0]))
}

function getArgsFromMetadata(m: MetricMetadataType): string {
    let t = toTitleCase(m.name)
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

export function generateTelemetry(telemetryJson: MetricDefinitionRoot): string {
    const metadataTypes = telemetryJson.types
    const metrics = telemetryJson.metrics
    let str = ''

    metadataTypes?.forEach((m: MetadataType) => {
        if ((m?.allowedValues?.length ?? 0) === 0) {
            return
        }
        let values: string = ''
        if (isNumberArray(m.allowedValues)) {
            values = (m.allowedValues as number[])!.join(' | ')
        } else {
            values = (m.allowedValues as string[])!.map((item: string) => `'${item}'`).join(' | ')
        }

        str += `export type ${toTitleCase(m.name)} = ${values}\n`
    })

    metrics.forEach((metric: Metric) => {
        const metadata: MetricMetadataType[] =
            metric.metadata?.map((item: MetricMetadata) => {
                const foundMetadata: MetadataType | undefined = metadataTypes?.find(
                    (candidate: MetadataType) => candidate.name === item.type
                )
                if (!foundMetadata) {
                    console.log(`Metric ${metric.name} references metadata ${item.type} that is not found!`)
                    throw undefined
                }

                return {
                    ...foundMetadata,
                    required: item.required ?? true,
                }
            }) ?? []

        const name = metricToTypeName(metric)
        str += `export interface ${name} {
    ${metadata.map(item => `\n// ${item.description}\n${getArgsFromMetadata(item)}`).join(',')}
    ${globalArgs().join(',\n')}
}`

        str += `\n/**
      * ${metric.description}
      * @param args See the ${name} interface
      * @returns Nothing
      */\n`

        str += `export function record${name}(args${metadata.every(item => !item.required) ? '?' : ''}: ${name}) {
    let metadata: any[] = []
    ${metadata
        .map(
            (item: MetadataType) =>
                `if(args?.${item.name} !== undefined) {metadata.push({Key: '${item.name}', Value: args.${item.name}.toString()})}`
        )
        .join('\n')}
        globals.telemetry.record({
            MetricName: '${metric.name}',
            Value: args?.value ?? 1,
            EpochTimestamp: (args?.createTime ?? new globals.clock.Date()).getTime(),
            Unit: '${metric.unit ?? 'None'}',
            Passive: args?.passive ?? ${metric.passive},
            Metadata: metadata
        })
}`
    })

    return str
}

export async function generate(args: CommandLineArguments) {
    let output = `
    /*!
     * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
     * SPDX-License-Identifier: Apache-2.0
     */

    import globals from '../extensionGlobals'
    `

    const rawDefinitions: MetricDefinitionRoot = args.inputFiles
        .map(path => {
            const fileInput = readFileSync(path, 'utf8')
            return validateInput(fileInput, path)
        })
        .reduce(
            (item: MetricDefinitionRoot, input: MetricDefinitionRoot) => {
                item.types!.push(...(input.types ?? []))
                item.metrics.push(...input.metrics)
                return item
            },
            { types: [], metrics: [] }
        )
    // Allow read in files to overwrite default definitions. First one wins, so the extra
    // files are read before the default resources (above)
    const input = {
        types: _.uniqBy(rawDefinitions.types, 'name'),
        metrics: _.uniqBy(rawDefinitions.metrics, 'name'),
    }
    output += generateTelemetry(input)
    output += generateHelperFunctions()

    const options = await prettier.resolveConfig(await readFile(`${__dirname}/../.prettierrc`, 'utf-8'))
    const formattedOutput = prettier.format(output, { parser: 'typescript', ...options })

    writeFileSync(args.outputFile, formattedOutput)

    console.log('Done generating!')
}

export function generateHelperFunctions(): string {
    return `

export function millisecondsSince(d: Date): number {
    return globals.clock.Date.now() - Number(d)
}
`
}
