/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import {
    Diagnostic,
    DiagnosticSeverity,
    PropertyASTNode,
    Range,
    TextDocument,
} from 'vscode-json-languageservice'

export default function getPropertyNodeDiagnostic(propNode: PropertyASTNode, document: TextDocument, message: string): Diagnostic {
    const { length, offset } = propNode.keyNode
    const range = Range.create(document.positionAt(offset), document.positionAt(offset + length))

    return Diagnostic.create(range, message, DiagnosticSeverity.Error)
}
