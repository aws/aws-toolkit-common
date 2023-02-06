/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import {
    ArrayASTNode,
    ASTNode,
    Diagnostic,
    ObjectASTNode,
    PropertyASTNode,
    TextDocument
} from 'vscode-json-languageservice'

import { isArrayNode, isObjectNode } from '../../utils/astUtilityFunctions'

import getPropertyNodeDiagnostic from './getPropertyNodeDiagnostic'

import { MESSAGES } from '../../constants/diagnosticStrings'
import schema from '../validationSchema'

const referenceTypes = schema.ReferenceTypes as any

interface SchemaObject {
    [property: string]: SchemaObject | boolean | string
}

// eslint-disable-next-line @typescript-eslint/ban-types
function isObject(obj: any): obj is Object {
    return obj === Object(obj)
}

function getDiagnosticsForArrayOfSchema(rootNode: ArrayASTNode, document: TextDocument, arraySchema: string) {
    const newSchemaPart = referenceTypes[arraySchema] as SchemaObject
    let diagnostics: Diagnostic[] = []

    if (isObject(newSchemaPart)) {
        rootNode.items.forEach(itemNode => {
            if (isObjectNode(itemNode)) {
                diagnostics = diagnostics.concat(getDiagnosticsForNode(itemNode, document, newSchemaPart))
            }
        })
    }

    return diagnostics
}

function getDiagnosticsForOneOfSchema(
    rootNode: ObjectASTNode,
    document: TextDocument,
    schemaPart: SchemaObject,
    oneOfSchema: string
) {
    const mutuallyExclusiveProperties: any = referenceTypes[oneOfSchema]
    const mutuallyExclusivePropertiesPresent: { propNode: PropertyASTNode; schemaValue: unknown }[] = []
    let diagnostics: Diagnostic[] = []

    rootNode.properties.forEach(prop => {
        if (!isObject(mutuallyExclusiveProperties)) {
            return
        }

        const propName = prop.keyNode.value
        const propertySchema = mutuallyExclusiveProperties[propName]

        // If the property is one of mutually exclusive properties
        if (propertySchema) {
            mutuallyExclusivePropertiesPresent.push({ propNode: prop, schemaValue: propertySchema })
            // If the property is neither in the set nor in the schema props
        } else if (!schemaPart[propName]) {
            diagnostics.push(getPropertyNodeDiagnostic(prop, document, MESSAGES.INVALID_PROPERTY_NAME))
        }
    })

    // if there is more than one item mark them all as invalid
    if (mutuallyExclusivePropertiesPresent.length > 1) {
        mutuallyExclusivePropertiesPresent.forEach(oneOfProp => {
            diagnostics.push(
                getPropertyNodeDiagnostic(oneOfProp.propNode, document, MESSAGES.MUTUALLY_EXCLUSIVE_CHOICE_PROPERTIES)
            )
        })
        // if there is only one item and it is an object
        // recursively continue on with validation
    } else if (mutuallyExclusivePropertiesPresent.length) {
        const { schemaValue, propNode } = mutuallyExclusivePropertiesPresent[0]
        const { valueNode } = propNode
        if (valueNode && isObject(schemaValue)) {
            diagnostics = diagnostics.concat(getDiagnosticsForNode(valueNode, document, schemaValue as SchemaObject))
        }
    }

    return diagnostics
}

function getDiagnosticsForRegularProperties(rootNode: ObjectASTNode, document: TextDocument, schemaPart: SchemaObject) {
    const diagnostics: Diagnostic[] = []

    if (schemaPart.properties) {
        schemaPart = schemaPart.properties as SchemaObject
    }

    rootNode.properties.forEach(prop => {
        const propName = prop.keyNode.value
        const propertySchema: unknown = schemaPart[propName]

        if (!propertySchema) {
            diagnostics.push(getPropertyNodeDiagnostic(prop, document, MESSAGES.INVALID_PROPERTY_NAME))
        } else if (prop.valueNode && isObject(propertySchema)) {
            // evaluate nested schema
            diagnostics.push(...getDiagnosticsForNode(prop.valueNode, document, propertySchema as SchemaObject))
        }
    })

    return diagnostics
}

export default function getDiagnosticsForNode(
    rootNode: ASTNode,
    document: TextDocument,
    schemaPart: SchemaObject
): Diagnostic[] {
    const arrayOfType = schemaPart['Fn:ArrayOf']
    const oneOfType = schemaPart['Fn:OneOf']
    const valueOfType = schemaPart['Fn:ValueOf']

    // Fn:ArrayOf
    // if it contains Fn:ArrayOf property all the other values will be ignored
    if (typeof arrayOfType === 'string' && isArrayNode(rootNode)) {
        return getDiagnosticsForArrayOfSchema(rootNode, document, arrayOfType)
        // Fn:OneOf
    } else if (typeof oneOfType === 'string' && isObjectNode(rootNode)) {
        return getDiagnosticsForOneOfSchema(rootNode, document, schemaPart, oneOfType)
        // Fn:ValueOf
    } else if (typeof valueOfType === 'string' && isObjectNode(rootNode)) {
        const newSchemaPart = referenceTypes[valueOfType] as SchemaObject

        return getDiagnosticsForNode(rootNode, document, newSchemaPart)
        // Regular properties
    } else if (isObjectNode(rootNode)) {
        return getDiagnosticsForRegularProperties(rootNode, document, schemaPart)
    }

    return []
}
