/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */
import { dump, load } from 'js-yaml'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Position } from 'vscode-languageserver-types'
import { ProcessYamlDocForCompletionOutput } from '../utils/astUtilityFunctions'

const YAML_RESERVED_KEYWORDS = ['y', 'yes', 'n', 'no', 'true', 'false', 'on', 'off']
const RETRY_CATCH_STATES = ['Task', 'Map', 'Parallel']
const RETRY_CATCH_STATES_REGEX_STRING = `(${RETRY_CATCH_STATES.join(')|(')})`
const CATCH_RETRY_STATE_REGEX = new RegExp(
    `['"]{0,1}Type['"]{0,1}\\s*:\\s*['"]{0,1}(${RETRY_CATCH_STATES_REGEX_STRING})['"]{0,1}`
)
const STATES_PROP_STRING = 'States:'
const CATCH_PROP_STRING = 'Catch:'
const RETRY_PROP_STRING = 'Retry:'

/**
 * @typedef {Object} ProcessYamlDocForCompletionOutput
 * @property {string} modifiedDocText - The text document derived from the document parameter which will be used to generate code completions
 * @property {Position} tempPositionForCompletions - The Position within modifiedDocText which will be used to generate code completions
 * @property {Position} startPositionForInsertion - The starting Position for the insert range applied to the generated code completions
 * @property {Position} endPositionForInsertion - The ending Position for the insert range applied to the generated code completions
 * @property {Position} shouldPrependSpace - A boolean indicating whether the generated code completions should have a space prepended to them
 */

/**
 *
 * @param {TextDocument} document
 * @param {Position} position
 * @returns {ProcessYamlDocForCompletionOutput}
 */
export function processYamlDocForCompletion(
    document: TextDocument,
    position: Position
): ProcessYamlDocForCompletionOutput {
    const lineOffsets = getLineOffsets(document.getText())
    const { currentLine, currentLineEnd } = getCurrentLine(document, position, lineOffsets)

    if (currentLine.indexOf(':') === -1) {
        return processLineWithoutColon(document, position, currentLine, currentLineEnd)
    } else {
        return processLineWithColon(document, position, currentLine, currentLineEnd)
    }
}

function processLineWithoutColon(
    document: TextDocument,
    cursorPosition: Position,
    currentLine: string,
    currentLineEnd: number
): ProcessYamlDocForCompletionOutput {
    let modifiedDocText: string
    let shouldPrependSpace = false

    const tempPositionForCompletions: Position = { ...cursorPosition }
    const startPositionForInsertion: Position = { ...cursorPosition }

    // Since there's no colon to separate the key and value, replace all text after the cursor.
    const endPositionForInsertion: Position = {
        line: cursorPosition.line,
        character: currentLine.length
    }

    const docText = document.getText()
    const docTextLength = docText.length
    const lineOffsets = getLineOffsets(docText)
    const trimmedLine = currentLine.trim()

    let preText: string
    let postText: string
    let insertedText: string

    // Current line has no non-space characters, insert a placeholder node at the end of the line
    if (trimmedLine.length === 0) {
        preText = docText.substring(0, currentLineEnd)
        insertedText = '"":\n'
        postText = docText.slice(lineOffsets[cursorPosition.line + 1] || docTextLength)

        tempPositionForCompletions.character += 1

        // Trimmed line starts with '-'
    } else if (trimmedLine.length >= 1 && trimmedLine[0] === '-') {
        // Set start of insertion range to be immediately after the hyphen.
        const hyphenIndex = currentLine.indexOf('-')
        startPositionForInsertion.character = hyphenIndex + 1
        shouldPrependSpace = true

        const postHyphenTextTrimmed = currentLine.substring(hyphenIndex + 1).trim()

        // No non-space characters after the hyphen, insert a placeholder node after the hyphen
        if (postHyphenTextTrimmed.length === 0) {
            tempPositionForCompletions.character = hyphenIndex + 3
            preText = docText.substring(0, lineOffsets[cursorPosition.line] + hyphenIndex)
            insertedText = "- '':\n"
            postText = docText.slice(lineOffsets[cursorPosition.line + 1] || docTextLength)

            // There are non-space character after the hyphen, but no colon. Just insert colon at end of line.
        } else {
            preText = docText.substring(0, currentLineEnd)
            insertedText = (!currentLine.endsWith(' ') ? ' ' : '') + ':\n'
            postText = docText.slice(lineOffsets[cursorPosition.line + 1] || docTextLength)
        }

        // Non-empty line but missing colon, add colon to end of current line
    } else {
        preText = docText.substring(0, currentLineEnd)
        insertedText = ':\n'
        postText = docText.slice(lineOffsets[cursorPosition.line + 1] || docTextLength)

        // Starting pos is first non-space character
        startPositionForInsertion.character = currentLine.indexOf(trimmedLine)
    }

    // eslint-disable-next-line prefer-const
    modifiedDocText = `${preText}${insertedText}${postText}`

    return {
        modifiedDocText,
        tempPositionForCompletions,
        startPositionForInsertion,
        endPositionForInsertion,
        shouldPrependSpace
    }
}

function processLineWithColon(
    document: TextDocument,
    cursorPosition: Position,
    currentLine: string,
    currentLineEnd: number
): ProcessYamlDocForCompletionOutput {
    const docText = document.getText()
    const docTextLength = docText.length

    let modifiedDocText: string = docText
    let shouldPrependSpace = false

    const tempPositionForCompletions: Position = { ...cursorPosition }
    const startPositionForInsertion: Position = { ...cursorPosition }
    const endPositionForInsertion: Position = { ...cursorPosition }

    const charNum = cursorPosition.character
    const lineOffsets = getLineOffsets(docText)

    let preText: string
    let postText: string
    let insertedText: string

    // Current line has a colon, determine if cursor position is right or left of it
    const colonIndex = currentLine.indexOf(':')

    // Cursor is left of the colon.
    if (charNum <= colonIndex) {
        // Start position is first non-space character, ending position is left of colon.
        const preColonTextTrimmed = currentLine.substring(0, colonIndex).trim()

        // Only whitespace before the colon.
        if (preColonTextTrimmed.length === 0) {
            // Insert placeholder quotes and place cursor inside of them.
            preText = docText.substring(0, lineOffsets[cursorPosition.line] + colonIndex)
            insertedText = "''"
            postText = docText.slice(lineOffsets[cursorPosition.line] + colonIndex)

            startPositionForInsertion.character = colonIndex
            endPositionForInsertion.character = colonIndex
            tempPositionForCompletions.character = colonIndex + 1

            // Only hyphen before the colon.
        } else if (preColonTextTrimmed.length === 1 && preColonTextTrimmed.charAt(0) === '-') {
            // Insert placeholder quotes and place cursor inside of them.
            preText = docText.substring(0, lineOffsets[cursorPosition.line] + colonIndex)
            insertedText = " ''"
            postText = docText.slice(lineOffsets[cursorPosition.line] + colonIndex)

            startPositionForInsertion.character = colonIndex
            endPositionForInsertion.character = colonIndex

            // Move cursor to be inside the quotes
            tempPositionForCompletions.character = colonIndex + 2
            shouldPrependSpace = currentLine.charAt(Math.max(colonIndex - 1, 0)) !== ' '
        } else {
            // Set start of insertion range to be where the non-whitespace characters start.
            startPositionForInsertion.character = currentLine.indexOf(preColonTextTrimmed)
            // Set end of insertion range to be immediately before the colon.
            endPositionForInsertion.character = colonIndex

            preText = docText
            insertedText = ''
            postText = ''

            // If the non-whitespace characters start with a hyphen, adjust starting position to be after the hyphen
            if (preColonTextTrimmed.charAt(0) === '-') {
                startPositionForInsertion.character = Math.min(startPositionForInsertion.character + 2, colonIndex)
            }
        }

        // Cursor is right of the colon.
    } else {
        // Starting position is immediately after the colon, end is end of line
        startPositionForInsertion.character = colonIndex + 1
        endPositionForInsertion.character = currentLine.length
        shouldPrependSpace = true

        // Remove all trailing whitespace on that line and adjust tempPositionForCompletions if needed
        let numTrailingSpacesToRemove = 0
        while (currentLine.charAt(currentLine.length - numTrailingSpacesToRemove - 1) === ' ') {
            numTrailingSpacesToRemove++
        }
        tempPositionForCompletions.character = Math.min(
            tempPositionForCompletions.character,
            currentLine.length - numTrailingSpacesToRemove - 1
        )

        // If after removing trailing spaces, the last character is the colon, add a placeholder empty string value
        const postColonTextTrimmed = currentLine.substring(colonIndex + 1).trim()
        const hasOnlyWhitespaceAfterColon = postColonTextTrimmed.length === 0

        preText = docText.substring(0, currentLineEnd - numTrailingSpacesToRemove)
        insertedText = (hasOnlyWhitespaceAfterColon ? ' ""' : '') + '\n'
        postText = docText.slice(lineOffsets[cursorPosition.line + 1] || docTextLength)

        if (hasOnlyWhitespaceAfterColon) {
            // Move cursor inside of quotes
            tempPositionForCompletions.character += 2
        } else {
            // Current line has non-whitespace characters following the colon.
            const indexOfPostColonCharacters = currentLine.indexOf(postColonTextTrimmed)

            // Cursor is between colon and start of post-colon characters
            if (charNum < indexOfPostColonCharacters) {
                // Move cursor to be at immediately before the value
                tempPositionForCompletions.character = indexOfPostColonCharacters
            }
        }
    }

    modifiedDocText = `${preText}${insertedText}${postText}`

    return {
        modifiedDocText,
        tempPositionForCompletions,
        startPositionForInsertion,
        endPositionForInsertion,
        shouldPrependSpace
    }
}

// Returns an array of offsets corresponding to the line breaks in the provided text
function getLineOffsets(text: string): number[] {
    const lineOffsets: number[] = []
    let isLineStart = true

    for (let i = 0; i < text.length; i++) {
        if (isLineStart) {
            lineOffsets.push(i)
            isLineStart = false
        }
        const ch = text.charAt(i)
        isLineStart = ch === '\r' || ch === '\n'
        if (ch === '\r' && i + 1 < text.length && text.charAt(i + 1) === '\n') {
            i++
        }
    }

    if (isLineStart && text.length > 0) {
        lineOffsets.push(text.length)
    }

    return lineOffsets
}

// Returns the text for the current line as well as the offset at which the line ends.
function getCurrentLine(
    document: TextDocument,
    position: Position,
    lineOffsets: number[]
): {
    currentLine: string
    currentLineEnd: number
} {
    const docText = document.getText()
    const lineNum: number = position.line

    const lineStart = lineOffsets[lineNum]
    let lineEnd = lineOffsets[lineNum + 1] ? lineOffsets[lineNum + 1] : docText.length

    if (lineEnd - 1 >= 0 && isCharEol(docText.charCodeAt(lineEnd - 1))) {
        lineEnd--
    }

    const textLine = docText.substring(lineStart, lineEnd)

    return {
        currentLine: textLine,
        currentLineEnd: lineEnd
    }
}

// Returns true iff the character code matches LF or CR
function isCharEol(c: number) {
    return c === 0x0a || c === 0x0d
}

export function isStateNameReservedYamlKeyword(stateName: string): boolean {
    return YAML_RESERVED_KEYWORDS.indexOf(stateName.toLowerCase()) !== -1
}

export function convertJsonSnippetToYaml(snippetText: string) {
    // Convert to YAML with indendation of 1 space
    return (
        dump(load(snippetText), { indent: 1 })
            // Remove quotation marks
            .replace(/[']/g, '')
            .split('\n')
            // For each line replace left padding spaces with tabs
            .map((line: any) => {
                if (line.length) {
                    let numOfSpaces = 0

                    // Count number of spaces that the line begins with
                    for (const char of line) {
                        if (char === ' ') {
                            numOfSpaces++
                        } else {
                            break
                        }
                    }

                    // Convert each space to tab character. Even though tab carracters are not valid yaml whitespace characters
                    // the vscode will convert them to the correct number of spaces according to user preferences.
                    return '\t'.repeat(numOfSpaces) + line.slice(numOfSpaces, line.length)
                } else {
                    return line
                }
            })
            .join('\n')
    )
}

function getNumberOfLeftSpaces(text: string) {
    return text.length - text.trimLeft().length
}

function getBackwardOffsetData(text: string, offset: number, initialNumberOfSpaces: number) {
    let isDirectChildOfStates = false
    let isGrandChildOfStates = false
    let isWithinCatchRetryState = false
    let hasCatchPropSibling = false
    let hasRetryPropSibling = false
    let beginLineOffset = offset
    let levelsDown = 0

    for (let i = offset; i >= 0; i--) {
        if (text[i] === '\n') {
            const lineText = text.slice(i + 1, beginLineOffset)
            const numberOfPrecedingSpaces = getNumberOfLeftSpaces(lineText)
            const trimmedLine = lineText.trim()
            beginLineOffset = i

            // Ignore empty lines
            if (trimmedLine.length === 0) {
                continue
            }

            // If number of spaces lower than that of the cursor
            // it is a parent property or a sibling of parent property
            if (numberOfPrecedingSpaces < initialNumberOfSpaces) {
                if (trimmedLine.startsWith(STATES_PROP_STRING)) {
                    isDirectChildOfStates = levelsDown === 0
                    isGrandChildOfStates = levelsDown === 1
                    break
                    // If the indentation is one level lower increase the number in levelsDown variable
                    // and start checking if the offset is a "grandchild" of states.
                } else if (levelsDown === 0) {
                    levelsDown++
                    continue
                    // When the levelDown is 1 it means there is no point of searching anymore.
                    // We know that the offset is neither child nor grandchild of states. We have all the needed information.
                } else {
                    break
                }

                // If number of spaces is higher than that of the cursor it means it is a child
                // of the property or of its siblings
            } else if (numberOfPrecedingSpaces > initialNumberOfSpaces) {
                continue
            } else if (levelsDown > 0) {
                continue
            }

            hasCatchPropSibling = trimmedLine.startsWith(CATCH_PROP_STRING) || hasCatchPropSibling
            hasRetryPropSibling = trimmedLine.startsWith(RETRY_PROP_STRING) || hasRetryPropSibling

            const isCatchRetryState = CATCH_RETRY_STATE_REGEX.test(trimmedLine)

            if (isCatchRetryState) {
                isWithinCatchRetryState = true
            }
        }
    }

    return {
        isDirectChildOfStates,
        isGrandChildOfStates,
        isWithinCatchRetryState,
        hasCatchPropSibling,
        hasRetryPropSibling
    }
}

function getForwardOffsetData(text: string, offset: number, initialNumberOfSpaces: number) {
    let isWithinCatchRetryState = false
    let hasCatchPropSibling = false
    let hasRetryPropSibling = false
    let beginLineOffset = offset

    // Iterate the text forwards from the offset
    for (let i = offset; i <= text.length; i++) {
        if (text[i] === '\n') {
            const lineText = text.slice(beginLineOffset + 1, i)
            const trimmedLine = lineText.trim()
            const numberOfPrecedingSpaces = getNumberOfLeftSpaces(lineText)
            beginLineOffset = i

            // Ignore empty lines
            if (trimmedLine.length === 0) {
                continue
            }

            // If number of spaces lower than that of the cursor
            // it is a parent property or a sibling of parent property
            if (numberOfPrecedingSpaces < initialNumberOfSpaces) {
                break
                // If number of spaces is higher than that of the cursor it means it is a child
                // of the property or of its siblings
            } else if (numberOfPrecedingSpaces > initialNumberOfSpaces) {
                continue
            }

            hasCatchPropSibling = trimmedLine.startsWith(CATCH_PROP_STRING) || hasCatchPropSibling
            hasRetryPropSibling = trimmedLine.startsWith(RETRY_PROP_STRING) || hasRetryPropSibling

            const isCatchRetryState = CATCH_RETRY_STATE_REGEX.test(trimmedLine)

            if (isCatchRetryState) {
                isWithinCatchRetryState = true
            }
        }
    }

    return {
        isWithinCatchRetryState,
        hasCatchPropSibling,
        hasRetryPropSibling
    }
}

export function getOffsetData(document: TextDocument, offset: number) {
    const text = document.getText()
    const indexOfLastNewLine = text.lastIndexOf('\n', offset - 1)
    const indexOfNextNewLine = text.indexOf('\n', offset)
    const cursorLine = text.substring(indexOfLastNewLine + 1, indexOfNextNewLine)
    const hasCursorLineNonSpace = /\S/.test(cursorLine)
    const numberOfSpacesCursorLine = getNumberOfLeftSpaces(text.substring(indexOfLastNewLine + 1, offset))
    const initialNumberOfSpaces = numberOfSpacesCursorLine
    let isDirectChildOfStates = false
    let isWithinCatchRetryState = false
    let hasCatchPropSibling = false
    let hasRetryPropSibling = false

    if (!hasCursorLineNonSpace && numberOfSpacesCursorLine > 0) {
        const backwardOffsetData = getBackwardOffsetData(text, offset, initialNumberOfSpaces)
        const forwardOffsetData = getForwardOffsetData(text, offset, initialNumberOfSpaces)

        isDirectChildOfStates = backwardOffsetData.isDirectChildOfStates
        isWithinCatchRetryState =
            (backwardOffsetData.isWithinCatchRetryState || forwardOffsetData.isWithinCatchRetryState) &&
            backwardOffsetData.isGrandChildOfStates
        hasCatchPropSibling = backwardOffsetData.hasCatchPropSibling || forwardOffsetData.hasCatchPropSibling
        hasRetryPropSibling = backwardOffsetData.hasRetryPropSibling || forwardOffsetData.hasRetryPropSibling
    }

    return {
        isDirectChildOfStates,
        isWithinCatchRetryState,
        hasCatchPropSibling,
        hasRetryPropSibling
    }
}
