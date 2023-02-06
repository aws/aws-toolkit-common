/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import {
    ASTNode,
    CompletionItem,
    CompletionItemKind,
    InsertTextFormat,
    PropertyASTNode
} from 'vscode-json-languageservice'

import { errorHandling } from '../snippets/error_handling'
import { states } from '../snippets/states'
import { findPropChildByName, insideStateNode, isChildOfStates, isObjectNode } from '../utils/astUtilityFunctions'

interface Snippet {
    name: string
    body: string[]
    description: string
}

const ERROR_HANDLING_STATES = ['Task', 'Parallel', 'Map']
export const stateSnippets = parseSnippetsFromJson(states)
export const errorHandlingSnippets = parseSnippetsFromJson(errorHandling)

function parseSnippetsFromJson(json: Snippet[]): CompletionItem[] {
    return json.map(snippet => {
        const item = CompletionItem.create(snippet.name)
        item.kind = CompletionItemKind.Snippet
        item.insertTextFormat = InsertTextFormat.Snippet
        item.insertText = snippet.body.join('\n')
        item.documentation = snippet.description

        return item
    })
}

function doesStateSupportErrorHandling(node: ASTNode): boolean {
    let typeNode: PropertyASTNode | undefined

    if (isObjectNode(node)) {
        typeNode = findPropChildByName(node, 'Type')
    }

    return ERROR_HANDLING_STATES.includes(typeNode?.valueNode?.value as string)
}
interface CompleteSnippetsOptions {
    shouldShowStateSnippets?: boolean
    shouldShowErrorSnippets?: {
        retry: boolean
        catch: boolean
    }
}

export default function completeSnippets(
    node: ASTNode | undefined,
    offset: number,
    options?: CompleteSnippetsOptions
): CompletionItem[] {
    if (node) {
        const errorSnippetOptionsNotDefined = options?.shouldShowErrorSnippets === undefined
        // If the value of shouldShowStateSnippets is false prevent the snippets from being displayed
        const showStateSnippets =
            options?.shouldShowStateSnippets ||
            (options?.shouldShowStateSnippets === undefined && isChildOfStates(node))

        if (showStateSnippets) {
            return stateSnippets
        }

        if (errorSnippetOptionsNotDefined) {
            if (insideStateNode(node) && doesStateSupportErrorHandling(node)) {
                return errorHandlingSnippets
            }

            return []
        }

        const errorSnippetsToShow: string[] = []

        if (options?.shouldShowErrorSnippets?.catch) {
            errorSnippetsToShow.push('Catch')
        }

        if (options?.shouldShowErrorSnippets?.retry) {
            errorSnippetsToShow.push('Retry')
        }

        if (errorSnippetsToShow.length) {
            return errorHandlingSnippets.filter(snippet => errorSnippetsToShow.includes(snippet.label))
        }
    }

    return []
}
