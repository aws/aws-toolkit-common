/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetadataType, MetricMetadataType, MetricMetadata, Metric, MetricDefinitionRoot } from './parser'

function toTitleCase(s: string): string {
    return s.replace(s[0], s[0].toUpperCase())
}

// converts snake_case to PascalCase. E.x. lambda_invoke => LambdaInvoke
function metricToTypeName(m: Metric): string {
    return m.name
        .split('_')
        .map(toTitleCase)
        .join('')
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
        const metadata: MetricMetadataType[] = metric.metadata?.map((item: MetricMetadata) => {
            const foundMetadata: MetadataType | undefined = metadataTypes?.find(
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
        }) ?? []

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
    let metadata: any[] = []
    ${metadata.map(
        (item: MetadataType) => `if(args.${item.name}) {metadata.push({Key: '${item.name}', Value: args.${item.name}.toString()})}`
    ).join('\n')}
    ext.telemetry.record({
            createTime: args?.createTime ?? new Date(),
            data: [{
                MetricName: '${metric.name}',
                Value: args?.value ?? 1,
                Unit: '${metric.unit ?? 'None'}',
                Metadata: metadata
            }]
        })
}`
    })

    return str
}

export function generateHelperFunctions(): string {
    return `
export function millisecondsSince(d: Date): number {
    return Date.now() - Number(d)
}
`
}
