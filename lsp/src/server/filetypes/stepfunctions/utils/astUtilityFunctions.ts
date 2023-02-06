/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { ArrayASTNode, ASTNode, ObjectASTNode, PropertyASTNode, StringASTNode } from 'vscode-json-languageservice'
import { Position } from 'vscode-languageserver-types'

export interface ASLOptions {
    ignoreColonOffset?: boolean
    shouldShowStateSnippets?: boolean
    shouldShowErrorSnippets?: {
        retry: boolean
        catch: boolean
    }
}

export interface CompleteStateNameOptions {
    shouldAddLeftQuote?: boolean
    shouldAddRightQuote?: boolean
    shouldAddLeadingSpace?: boolean
    shouldAddTrailingComma?: boolean
}

export interface ProcessYamlDocForCompletionOutput {
    modifiedDocText: string
    tempPositionForCompletions: Position
    startPositionForInsertion: Position
    endPositionForInsertion: Position
    shouldPrependSpace: boolean
}

export function isStringNode(node: ASTNode): node is StringASTNode {
    return node.type === 'string'
}

export function isPropertyNode(node: ASTNode): node is PropertyASTNode {
    return node.type === 'property'
}

export function isObjectNode(node: ASTNode): node is ObjectASTNode {
    return node.type === 'object'
}

export function isArrayNode(node: ASTNode): node is ArrayASTNode {
    return node.type === 'array'
}

export function findPropChildByName(rootNode: ObjectASTNode, name: string): PropertyASTNode | undefined {
    return rootNode.properties.find(propNode => propNode.keyNode.value === name)
}

function isLocationInNodeRange(node: ASTNode, loc: number) {
    return loc >= node.offset && loc <= node.offset + node.length
}

export function isChildOfStates(node: ASTNode): boolean {
    return !!node.parent && isPropertyNode(node.parent) && node.parent.keyNode.value === 'States'
}

export function insideStateNode(node: ASTNode): boolean {
    const greatGrandParentNode = node.parent?.parent?.parent

    return (
        !!greatGrandParentNode &&
        isPropertyNode(greatGrandParentNode) &&
        greatGrandParentNode.keyNode?.value === 'States'
    )
}

/** Finds the relevant node at a given location in respective json string */
export function findNodeAtLocation(rootNode: ASTNode, loc: number): ASTNode | undefined {
    if (isLocationInNodeRange(rootNode, loc)) {
        const { children } = rootNode

        if (children?.length) {
            const nodeInRange = children.find(node => isLocationInNodeRange(node, loc))

            if (nodeInRange) {
                return findNodeAtLocation(nodeInRange, loc)
            }
        }

        return rootNode
    }
}

/** Finds the closest ancestor property node named "States" */
export function findClosestAncestorStateNode(node: ASTNode): PropertyASTNode | undefined {
    if (isPropertyNode(node) && (node as PropertyASTNode).keyNode.value === 'States') {
        return node
    } else if (!node.parent) {
        return undefined
    }

    return findClosestAncestorStateNode(node.parent!)
}

/** Extracts the list of state names from given property node named "States" */
export function getListOfStateNamesFromStateNode(node: PropertyASTNode, ignoreColonOffset = false): string[] {
    const nodeName = node.keyNode.value

    if (nodeName === 'States') {
        // The first object node will contain property nodes containing state names
        const objNode = node.children.find(isObjectNode)

        return (
            objNode?.children
                // Filter out property nodes that do not have colonOffset. They are invalid.
                .filter(
                    childNode =>
                        isPropertyNode(childNode) &&
                        childNode.colonOffset &&
                        (ignoreColonOffset || (!ignoreColonOffset && childNode.colonOffset >= 0))
                )
                .map(propNode => (propNode as PropertyASTNode).keyNode.value) ?? []
        )
    } else {
        throw new Error('Not a state name property node')
    }
}
