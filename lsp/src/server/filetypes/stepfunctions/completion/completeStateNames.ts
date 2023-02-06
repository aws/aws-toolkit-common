/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import {
    ASTNode,
    CompletionItem,
    CompletionItemKind,
    CompletionList,
    PropertyASTNode,
    Range,
    TextDocument,
    TextEdit
} from 'vscode-json-languageservice'
import { LANGUAGE_IDS } from '../constants/constants'

import {
    ASLOptions,
    CompleteStateNameOptions,
    findClosestAncestorStateNode,
    getListOfStateNamesFromStateNode,
    isObjectNode,
    isPropertyNode,
    isStringNode
} from '../utils/astUtilityFunctions'
import { isStateNameReservedYamlKeyword } from '../yaml/yamlUtils'

function getStatesFromStartAtNode(node: PropertyASTNode, options?: ASLOptions): string[] {
    if (node.keyNode.value === 'StartAt') {
        if (node.parent && isObjectNode(node.parent)) {
            const statesNode = node.parent.properties.find(propNode => propNode.keyNode.value === 'States')

            if (statesNode) {
                return getListOfStateNamesFromStateNode(statesNode, options?.ignoreColonOffset)
            }
        }
    }

    return []
}

function getListOfItems(node: PropertyASTNode, options?: ASLOptions): string[] {
    const keyVal = node.keyNode.value

    switch (keyVal) {
        case 'StartAt': {
            return getStatesFromStartAtNode(node, options)
        }
        case 'Next':
        case 'Default': {
            const statesNode = findClosestAncestorStateNode(node)

            const stateItemNode = node.parent?.parent

            let stateItemName: string | undefined

            if (stateItemNode && isPropertyNode(stateItemNode)) {
                // The state name under cursor shouldn't be suggested - find the value
                stateItemName = stateItemNode.keyNode.value
                // If stateItemNode is not a property node go 3 levels up as it is Next within Choice state
            } else if (stateItemNode?.parent?.parent?.parent && isPropertyNode(stateItemNode.parent.parent.parent)) {
                stateItemName = stateItemNode.parent.parent.parent.keyNode.value
            }

            if (statesNode) {
                return getListOfStateNamesFromStateNode(statesNode, options?.ignoreColonOffset).filter(
                    name => name !== stateItemName
                )
            }

            return []
        }
        default: {
            return []
        }
    }
}

function getCompletionList(
    items: string[],
    replaceRange: Range,
    languageId: string,
    options: CompleteStateNameOptions
) {
    const { shouldAddLeftQuote, shouldAddRightQuote, shouldAddLeadingSpace, shouldAddTrailingComma } = options

    const list: CompletionList = {
        isIncomplete: false,
        items: items.map(name => {
            const shouldWrapStateNameInQuotes = languageId === LANGUAGE_IDS.YAML && isStateNameReservedYamlKeyword(name)
            const item = CompletionItem.create(name)
            item.commitCharacters = [',']

            item.kind = CompletionItemKind.Value

            const newText =
                (shouldAddLeadingSpace ? ' ' : '') +
                (shouldAddLeftQuote ? '"' : '') +
                (shouldWrapStateNameInQuotes ? "'" : '') +
                name +
                (shouldWrapStateNameInQuotes ? "'" : '') +
                (shouldAddRightQuote ? '"' : '') +
                (shouldAddTrailingComma ? ',' : '')
            item.textEdit = TextEdit.replace(replaceRange, newText)
            item.filterText = name

            return item
        })
    }

    return list
}

export default function completeStateNames(
    node: ASTNode | undefined,
    offset: number,
    document: TextDocument,
    options?: ASLOptions
): CompletionList | undefined {
    // For property nodes
    if (node && isPropertyNode(node) && node.colonOffset) {
        const states = getListOfItems(node, options)

        if (states.length) {
            const colonPosition = document.positionAt(node.colonOffset + 1)
            let endPosition = document.positionAt(node.offset + node.length)

            // The range shouldn't span multiple lines, if lines are different it is due to
            // lack of comma and text should be inserted in place
            if (colonPosition.line !== endPosition.line) {
                endPosition = colonPosition
            }

            const range = Range.create(colonPosition, endPosition)

            const completeStateNameOptions = {
                shouldAddLeftQuote: true,
                shouldAddRightQuote: true,
                shouldAddLeadingSpace: true,
                shouldAddTrailingComma: true
            }

            return getCompletionList(states, range, document.languageId, completeStateNameOptions)
        }
    }

    // For string nodes that have a parent that is a property node
    if (node && node.parent && isPropertyNode(node.parent)) {
        const propNode = node.parent

        if (isStringNode(node)) {
            const states = getListOfItems(propNode, options)

            if (states.length) {
                // Text edit will only work when start position is higher than the node offset
                const startPosition = document.positionAt(node.offset + 1)
                const endPosition = document.positionAt(node.offset + node.length)

                const range = Range.create(startPosition, endPosition)
                if (document.languageId === LANGUAGE_IDS.YAML) {
                    const completeStateNameOptions = {
                        shouldAddLeftQuote: false,
                        shouldAddRightQuote: false,
                        shouldAddLeadingSpace: false,
                        shouldAddTrailingComma: false
                    }

                    return getCompletionList(states, range, document.languageId, completeStateNameOptions)
                } else {
                    const isCursorAtTheBeginning = offset === node.offset
                    const completeStateNameOptions = {
                        shouldAddLeftQuote: isCursorAtTheBeginning,
                        shouldAddRightQuote: true,
                        shouldAddLeadingSpace: false,
                        shouldAddTrailingComma: false
                    }

                    return getCompletionList(states, range, document.languageId, completeStateNameOptions)
                }
            }
        }
    }
}
