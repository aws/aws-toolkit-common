/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { Diagnostic, ObjectASTNode, TextDocument } from 'vscode-json-languageservice'

import { findPropChildByName } from '../utils/astUtilityFunctions'

import getDiagnosticsForNode from './utils/getDiagnosticsForNode'

import schema from './validationSchema'

export default function (oneStateValueNode: ObjectASTNode, document: TextDocument): Diagnostic[] {
    // Get the type of state
    const stateType = findPropChildByName(oneStateValueNode, 'Type')?.valueNode?.value
    const diagnostics: Diagnostic[] = []

    if (typeof stateType === 'string') {
        // tslint:disable-next-line no-unsafe-any
        const hasCommonProperties = !!(schema as any).StateTypes[stateType]?.hasCommonProperties
        // tslint:disable-next-line no-unsafe-any
        const stateProperties = (schema as any).StateTypes[stateType]?.Properties

        if (!stateProperties) {
            return []
        }

        const allowedProperties = hasCommonProperties
            ? { ...schema.Common, ...stateProperties }
            : { ...stateProperties }

        // tslint:disable-next-line no-unsafe-any
        diagnostics.push(...getDiagnosticsForNode(oneStateValueNode, document, allowedProperties))
    }

    return diagnostics
}
