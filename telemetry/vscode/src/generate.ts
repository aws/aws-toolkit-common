/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    Scope,
    Project,
    StructureKind,
    InterfaceDeclarationStructure,
    PropertySignatureStructure,
    TypeAliasDeclarationStructure,
    ClassDeclarationStructure,
    MethodDeclarationStructure,
    VariableStatementStructure,
    VariableDeclarationKind,
} from 'ts-morph'
import { readFile, readFileSync, writeFile } from 'fs-extra'
import _ = require('lodash')
import * as prettier from 'prettier'
import {
    MetadataType,
    MetricMetadataType,
    Metric,
    MetricDefinitionRoot,
    CommandLineArguments,
    validateInput,
} from './parser'

function toTitleCase(s: string): string {
    return s.replace(s[0], s[0].toUpperCase())
}

function snakeCaseToPascalCase(s: string): string {
    return s.split('_').map(toTitleCase).join('')
}

// converts snake_case to PascalCase. E.x. lambda_invoke => LambdaInvoke
function metricToTypeName(m: Metric): string {
    return snakeCaseToPascalCase(m.name)
}

export async function generate(args: CommandLineArguments) {
    const rawDefinitions: MetricDefinitionRoot = args.inputFiles
        .map(path => {
            const fileInput = readFileSync(path, 'utf8')
            return validateInput(fileInput, path)
        })
        .reduce(
            (item: MetricDefinitionRoot, input: MetricDefinitionRoot) => {
                item.types?.push(...(input.types ?? []))
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

    const output = generateFile(input, args.outputFile)
    const options = await prettier.resolveConfig(await readFile(`${__dirname}/../.prettierrc`, 'utf-8'))
    const formattedOutput = prettier.format(output.getFullText(), { parser: 'typescript', ...options })
    await writeFile(output.getFilePath(), formattedOutput)

    console.log('Done generating!')
}

const exportedTypes: TypeAliasDeclarationStructure[] = []

function getArgsFromMetadata(m: MetadataType): string {
    if (m.allowedValues) {
        const name = toTitleCase(m.name)
        const mm = exportedTypes.find(tt => tt.name === name)

        if (!mm) {
            exportedTypes.push({
                name,
                kind: StructureKind.TypeAlias,
                isExported: true,
                type: m.allowedValues.map(v => `'${v}'`).join(' | '),
            })
        }

        return name
    }

    switch (m.type) {
        case undefined:
        case 'string':
            return 'string'
        case 'double':
        case 'int':
            return 'number'
        case 'boolean':
            return 'boolean'
        default: {
            throw new TypeError(`unknown type ${m?.type} in metadata ${m.name}`)
        }
    }
}

function getTypeOrThrow(types: MetadataType[] = [], name: string) {
    const type = types.find(t => t.name === name)

    if (!type) {
        throw new Error(`did not find type: ${name}`)
    }

    return type
}

const baseName = 'MetricBase'
const commonMetadata = ['result', 'reason', 'duration']
const passive: PropertySignatureStructure = {
    isReadonly: true,
    hasQuestionToken: true,
    name: 'passive',
    type: 'boolean',
    docs: ['A flag indicating that the metric was not caused by the user.'],
    kind: StructureKind.PropertySignature,
}

const value: PropertySignatureStructure = {
    isReadonly: true,
    hasQuestionToken: true,
    name: 'value',
    type: 'number',
    docs: ['@deprecated Arbitrary "value" of the metric.'],
    kind: StructureKind.PropertySignature,
}

const runtimeMetricDefinition: InterfaceDeclarationStructure = {
    name: 'MetricDefinition',
    kind: StructureKind.Interface,
    isExported: true,
    properties: [
        {
            name: 'unit',
            type: 'string',
            isReadonly: true,
        },
        {
            name: 'passive',
            type: 'boolean',
            isReadonly: true,
        },
        {
            name: 'requiredMetadata',
            type: 'readonly string[]',
            isReadonly: true,
        }
    ]
}

const header = `
/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
`.trimStart()

function getMetricMetadata(metric: Metric) {
    return metric.metadata?.filter(m => !commonMetadata.includes(m.type)) ?? []
}

function generateMetadataProperty(metadata: MetricMetadataType): PropertySignatureStructure {
    return {
        isReadonly: true,
        name: metadata.name,
        docs: [metadata.description],
        kind: StructureKind.PropertySignature,
        type: getArgsFromMetadata(metadata),
        hasQuestionToken: !metadata.required,
    }
}

function generateMetricBase(types: MetadataType[] | undefined): InterfaceDeclarationStructure {
    const toProp = (name: string) => generateMetadataProperty({ required: false, ...getTypeOrThrow(types, name) })

    return {
        name: baseName,
        isExported: true,
        kind: StructureKind.Interface,
        properties: commonMetadata.map(toProp).concat(passive, value),
    }    
}

function generateMetricInterface(metric: Metric, types: MetadataType[] | undefined): InterfaceDeclarationStructure {
    return {
        name: metricToTypeName(metric),
        kind: StructureKind.Interface,
        extends: [baseName],
        isExported: true,
        properties: getMetricMetadata(metric).map(m => {
            return generateMetadataProperty({ ...getTypeOrThrow(types, m.type), required: m.required ?? true })
        }),
    }
}

function generateMetricRecorder(metadataType: TypeAliasDeclarationStructure): InterfaceDeclarationStructure {
    return {
        name: 'Metric',
        isExported: true,
        typeParameters: [`T extends ${baseName} = ${baseName}`],
        properties: [
            {
                name: 'name',
                type: 'string',
                isReadonly: true,
            }
        ],
        methods: [
            {
                docs: ['Adds data to the metric which is preserved for the remainder of the execution context'],
                name: 'record',
                returnType: 'void',
                parameters: [{
                    name: 'data',
                    type: `${metadataType.name}<T>`,
                }],
            },
            {
                docs: ['Sends the metric to the telemetry service'],
                name: 'emit',
                returnType: 'void',
                parameters: [{
                    name: 'data',
                    type: 'T',
                    hasQuestionToken: true,
                }],
            },
            {
                docs: ['Executes a callback, automatically sending the metric after completion'],
                name: 'run',
                typeParameters: ['U'],
                returnType: 'U',
                parameters: [{
                    name: 'fn',
                    type: `(span: this) => U`,
                }],
            }
        ],
        kind: StructureKind.Interface,
    }
}

function generateTelemetryHelper(recorder: InterfaceDeclarationStructure, metrics: Metric[]): ClassDeclarationStructure {
    const getMetric: MethodDeclarationStructure = {
        name: 'getMetric',
        scope: Scope.Protected,
        kind: StructureKind.Method,
        parameters: [{ name: 'name', type: 'string' }],
        returnType: recorder.name,
        isAbstract: true,
    }

    return {
        name: 'TelemetryBase',
        kind: StructureKind.Class,
        isAbstract: true,
        methods: [getMetric],
        getAccessors: metrics.map(m => {        
            return {
                scope: Scope.Public,
                name: m.name,
                docs: [m.description],
                returnType: `${recorder.name}<${metricToTypeName(m)}>`,
                statements: `return this.${getMetric.name}('${m.name}')`,
            }
        }),
        isExported: true,
    }
}

function generateMetricShapeMap(metrics: Metric[]): InterfaceDeclarationStructure {
    return {
        name: 'MetricShapes',
        kind: StructureKind.Interface,
        isExported: true,
        properties: metrics.map(m => {
            return {
                isReadonly: true,
                name: `'${m.name}'`,
                type: metricToTypeName(m),
            }
        }),
    }
}

function generateDefinitions(metrics: Metric[]): VariableStatementStructure {
    const fields = metrics.map(m => {
        const metadataTypes = getMetricMetadata(m).filter(m => m.required ?? true).map(m => `'${m.type}'`)
        const requiredMetadata = `[${metadataTypes.join(', ')}]`
        
        return `${m.name}: { unit: '${m.unit ?? 'None'}', passive: ${m.passive ?? false}, requiredMetadata: ${requiredMetadata} }`
    })

    return {
        isExported: true,
        declarations: [{
            name: 'definitions',
            type: `Record<string, ${runtimeMetricDefinition.name}>`,
            initializer: `{ ${fields.join(',\n')} }`,
        }],
        declarationKind: VariableDeclarationKind.Const,
        kind: StructureKind.VariableStatement,
    }
}

function generateFile(telemetryJson: MetricDefinitionRoot, dest: string) {
    const project = new Project({})
    const file = project.createSourceFile(dest, header, { overwrite: true })

    file.addInterface(generateMetricBase(telemetryJson.types))
    file.addInterfaces(telemetryJson.metrics.map(m => generateMetricInterface(m, telemetryJson.types)))
    file.addTypeAliases(exportedTypes)
    file.addInterface(runtimeMetricDefinition)

    const metricsMap = generateMetricShapeMap(telemetryJson.metrics)
    file.addInterface(metricsMap)
    file.addTypeAlias({
        isExported: true,
        name: 'MetricName',
        type: `keyof ${metricsMap.name}`,
    })

    const metadataType: TypeAliasDeclarationStructure = {
        isExported: true,
        name: 'Metadata',
        typeParameters: [`T extends ${baseName}`],
        type: `Partial<Omit<T, keyof ${baseName}>>`,
        kind: StructureKind.TypeAlias,
    }

    const definitions = generateDefinitions(telemetryJson.metrics)
    const recorder = generateMetricRecorder(metadataType)
    file.addVariableStatement(definitions)
    file.addTypeAlias(metadataType)
    file.addInterface(recorder)
    file.addClass(generateTelemetryHelper(recorder, telemetryJson.metrics))

    return file
}
