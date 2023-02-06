/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

// tslint:disable:no-floating-promises

import * as assert from 'assert'
import { CompletionItemKind } from 'vscode-json-languageservice'
import { CompletionList, Position, Range, TextDocumentPositionParams, TextEdit } from 'vscode-languageserver'
import { forceServiceConnection } from '../../../../../test/utils/service'
import { errorHandlingSnippets, stateSnippets } from '../completion/completeSnippets'
import { service as JsonService } from '../json'
import { toDocument } from './utils/testUtilities'

const document1 = `
{
    "StartAt":,
    "States": {
      "FirstState": {},
      "ChoiceState": {},
      "FirstMatchState": {},
      "SecondMatchState": {},
      "DefaultState": {},
      "NextState": {
        "Next":,
      },
      "ChoiceStateX": {
        "Type": "Choice",
        "Choices": [
          {
            "Next": ""
          },
          {
            "Next": "FirstState"
          },
          {
            "Next": "NextState"
          }
        ],
        "Default": ""
      },
    }
  }
`

const document2 = `
{
    "StartAt": ,
    "States": {
      "FirstState": {},
      "ChoiceState": {},
      "FirstMatchState": {},
      "SecondMatchState": {},
      "DefaultState": {},
      "NextState": {
        "Next": ,
      },
      "ChoiceStateX": {
        "Type": "Choice",
        "Choices": [
          {
            "Next": ""
          },
          {
            "Next": "FirstState"
          },
          {
            "Next": "NextState"
          }
        ],
        "Default":
      },
    }
  }
`

const document3 = `
{
    "StartAt": ",
    "States": {
      "FirstState": {},
      "ChoiceState": {},
      "FirstMatchState": {},
      "SecondMatchState": {},
      "DefaultState": {},
      "NextState": {
        "Next": ",
      },
      "ChoiceStateX": {}
    }
  }
`

const document4 = `
{
    "StartAt": "",
    "States": {
      "FirstState": {},
      "ChoiceState": {},
      "FirstMatchState": {},
      "SecondMatchState": {},
      "DefaultState": {},
      "NextState": {
        "Next": "",
      },
      "ChoiceStateX": {}
    }
  }
`
const document5 = `
{
  "StartAt": "First",
  "States": {
      "FirstState": {},
      "ChoiceState": {},
      "FirstMatchState": {},
      "SecondMatchState": {},
      "DefaultState": {},
      "NextState": {
        "Next": "First",
      },
      "ChoiceStateX": {}
  }
}
`

const document6 = `
{
  "StartAt": "First",
  "States": {
      "FirstState": {
        "Type": "Task"
      },
      "ChoiceState": {},
      "FirstMatchState": {},
      "SecondMatchState": {},
      "DefaultState": {},
      "NextState": {
        "Next": "First",
      },
      "Success State": {}
  }
}
`

const documentNested = `
{
  "StartAt": "First",
  "States": {
      "FirstState": {},
      "MapState": {
        "Iterator": {
          "StartAt":,
          "States": {
            "Nested1": {},
            "Nested2": {},
            "Nested3": {},
            "Nested4": {
              "Next":,
            },
          }
        },
      },
  }
}
`
const completionsEdgeCase1 = `{
  "Comment": "An example of the Amazon States Language using a map state to process elements of an array with a max concurrency of 2.",
  "StartAt": "Map",
  "States": {
      "Map": {
          "Type": "Map",
          "ItemsPath": "$.array",
          "ResultPath": "$$$.array$$$",
          "MaxConcurrency": 2,
          "Next": "Final State",
          "Iterator": {
              "StartAt": "Pass",
              "States": {
                  "Pass": {
                      "Type": "Pass",
                      "Result": "Done!",
                      "End": true
                  }
              }
          }
      },
      "
      "Net 2": {
          "Type": "Fail",
          "Next": "Final State"
      },
      "Final State": {
          "Type": "Pass",
          "Next": "Net 2"
      }
  }
}`

const completionsEdgeCase2 = `{
  "StartAt": "MyState",
  "States": {
      "
  }
}`

const itemLabels = [
    'FirstState',
    'ChoiceState',
    'FirstMatchState',
    'SecondMatchState',
    'DefaultState',
    'NextState',
    'ChoiceStateX'
]
const nestedItemLabels = ['Nested1', 'Nested2', 'Nested3', 'Nested4']

interface TestCompletionOptions {
    labels: string[]
    json: string
    position: [number, number]
    start: [number, number]
    end: [number, number]
    labelToInsertText(label: string): string
}

interface TestScenario {
    json: string
    position: [number, number]
    start: [number, number]
    end: [number, number]
}

async function getCompletions(json: string, position: [number, number]) {
    const { textDoc } = toDocument(json)
    const pos = Position.create(...position)
    const params = {
        textDocument: textDoc,
        position: pos
    } as TextDocumentPositionParams
    forceServiceConnection()
    return JsonService(textDoc.uri).completion(textDoc, params) as Promise<CompletionList>
}

async function testCompletions(options: TestCompletionOptions) {
    const { labels, json, position, start, end, labelToInsertText } = options

    const res = await getCompletions(json, position)

    assert.strictEqual(res?.items.length, labels.length)

    // space before quoted item
    const itemInsertTexts = labels.map(labelToInsertText)

    assert.deepEqual(
        res?.items.map(item => item.label),
        labels
    )
    assert.deepEqual(
        res?.items.map(item => item.textEdit?.newText),
        itemInsertTexts
    )

    const leftPos = Position.create(...start)
    const rightPos = Position.create(...end)

    res?.items.forEach(item => {
        assert.deepEqual((item.textEdit as TextEdit)?.range, Range.create(leftPos, rightPos))
    })
}

function getArrayIntersection(arrayOne: string[] | undefined, arrayTwo: string[] | undefined): string[] {
    if (arrayOne === undefined || arrayTwo === undefined) {
        return []
    }
    const arrayIntersection = arrayOne.filter(x => arrayTwo.includes(x))

    return arrayIntersection
}

async function getSuggestedSnippets(options: TestScenario) {
    const { json, position } = options
    const { textDoc } = toDocument(json)

    const pos = Position.create(...position)
    const params = {
        textDocument: textDoc,
        position: pos
    } as TextDocumentPositionParams
    forceServiceConnection()
    const res = (await JsonService(textDoc.uri).completion(textDoc, params)) as CompletionList

    const suggestedSnippetLabels = res?.items
        .filter(item => item.kind === CompletionItemKind.Snippet)
        .map(item => item.label)

    return suggestedSnippetLabels
}

suite('ASL context-aware completion', () => {
    suite('StartAt', () => {
        test('Cursor immedietely after colon', async () => {
            await testCompletions({
                labels: itemLabels,
                json: document1,
                position: [2, 14],
                start: [2, 14],
                end: [2, 15],
                labelToInsertText: label => ` "${label}",`
            })
        })

        test('Cursor not immedietely after colon but no quotes', async () => {
            await testCompletions({
                labels: itemLabels,
                json: document2,
                position: [2, 16],
                start: [2, 14],
                end: [2, 16],
                labelToInsertText: label => ` "${label}",`
            })
        })

        test('Left quotation mark present', async () => {
            await testCompletions({
                labels: itemLabels,
                json: document3,
                position: [2, 16],
                start: [2, 16],
                end: [2, 17],
                labelToInsertText: label => `${label}"`
            })
        })

        test('Both quotation marks present and cursor between them', async () => {
            await testCompletions({
                labels: itemLabels,
                json: document4,
                position: [2, 16],
                start: [2, 16],
                end: [2, 17],
                labelToInsertText: label => `${label}"`
            })
        })

        test('Suggests completions when text present and cursor is on it', async () => {
            await testCompletions({
                labels: itemLabels,
                json: document5,
                position: [2, 17],
                start: [2, 14],
                end: [2, 20],
                labelToInsertText: label => `${label}"`
            })
        })

        test('Suggests nested completions when StartAt is nested within Map state', async () => {
            await testCompletions({
                labels: nestedItemLabels,
                json: documentNested,
                position: [7, 20],
                start: [7, 20],
                end: [7, 21],
                labelToInsertText: label => ` "${label}",`
            })
        })
    })

    suite('Next', () => {
        test('Cursor immedietely after colon', async () => {
            await testCompletions({
                // remove last label as it is the name of the current state
                labels: itemLabels.filter(label => label !== 'NextState'),
                json: document1,
                position: [10, 15],
                start: [10, 15],
                end: [10, 16],
                labelToInsertText: label => ` "${label}",`
            })
        })

        test('Cursor not immedietely after colon but no quotes', async () => {
            await testCompletions({
                // remove last label as it is the name of the current state
                labels: itemLabels.filter(label => label !== 'NextState'),
                json: document2,
                position: [10, 17],
                start: [10, 15],
                end: [10, 17],
                labelToInsertText: label => ` "${label}",`
            })
        })

        test('Left quotation mark present', async () => {
            await testCompletions({
                // remove last label as it is the name of the current state
                labels: itemLabels.filter(label => label !== 'NextState'),
                json: document3,
                position: [10, 17],
                start: [10, 17],
                end: [10, 18],
                labelToInsertText: label => `${label}"`
            })
        })

        test('Both quotation marks present and cursor between them', async () => {
            await testCompletions({
                // remove last label as it is the name of the current state
                labels: itemLabels.filter(label => label !== 'NextState'),
                json: document4,
                position: [10, 17],
                start: [10, 17],
                end: [10, 18],
                labelToInsertText: label => `${label}"`
            })
        })

        test('Suggests completions when text present and cursor is on it', async () => {
            await testCompletions({
                // remove last label as it is the name of the current state
                labels: itemLabels.filter(label => label !== 'NextState'),
                json: document5,
                position: [10, 18],
                start: [10, 17],
                end: [10, 23],
                labelToInsertText: label => `${label}"`
            })
        })

        test('Suggests nested completions when Next is nested within Map state', async () => {
            await testCompletions({
                // remove last label as it is the name of the current state
                labels: nestedItemLabels.filter(label => label !== 'Nested4'),
                json: documentNested,
                position: [13, 21],
                start: [13, 21],
                end: [13, 22],
                labelToInsertText: label => ` "${label}",`
            })
        })

        test('Suggests completions for the Next property within Choice state', async () => {
            await testCompletions({
                labels: itemLabels.filter(label => label !== 'ChoiceStateX'),
                json: document1,
                position: [16, 21],
                start: [16, 21],
                end: [16, 22],
                labelToInsertText: label => `${label}"`
            })
        })
    })

    suite('Default', () => {
        test('Suggests completion items for Default property of the Choice state when cursor positioned after first quote', async () => {
            await testCompletions({
                labels: itemLabels.filter(label => label !== 'ChoiceStateX'),
                json: document1,
                position: [25, 20],
                start: [25, 20],
                end: [25, 21],
                labelToInsertText: label => `${label}"`
            })
        })

        test('Suggests completion items for Default property of the Choice state when cursor immeditely after colon', async () => {
            await testCompletions({
                labels: itemLabels.filter(label => label !== 'ChoiceStateX'),
                json: document2,
                position: [25, 18],
                start: [25, 18],
                end: [25, 18],
                labelToInsertText: label => ` "${label}",`
            })
        })
    })

    suite('Snippets', () => {
        test('Suggests state snippets when cursor positioned within `States` block but outside a state definition', async () => {
            const expectedSnippets = stateSnippets.map(item => item.label)
            const suggestedSnippets = await getSuggestedSnippets({
                json: document1,
                position: [5, 3],
                start: [5, 3],
                end: [5, 3]
            })

            assert.deepEqual(suggestedSnippets, expectedSnippets)
        })

        test('Does not suggest state snippets when cursor is inside a state definition', async () => {
            const notExpectedSnippets = stateSnippets.map(item => item.label)
            const suggestedSnippets = await getSuggestedSnippets({
                json: document1,
                position: [7, 28],
                start: [7, 28],
                end: [7, 28]
            })
            assert.deepEqual(getArrayIntersection(suggestedSnippets, notExpectedSnippets), [])
        })

        test('Suggests error handling snippets when cursor is positioned within a State that supports error handling', async () => {
            const expectedSnippets = errorHandlingSnippets.map(item => item.label)
            const suggestedSnippets = await getSuggestedSnippets({
                json: document6,
                position: [5, 25],
                start: [5, 25],
                end: [5, 25]
            })

            assert.deepEqual(suggestedSnippets, expectedSnippets)
        })

        test('Does not suggest error handling snippets when cursor is positioned within a State that does not support error handling', async () => {
            const notExpectedSnippets = errorHandlingSnippets.map(item => item.label)
            const suggestedSnippets = await getSuggestedSnippets({
                json: document6,
                position: [14, 27],
                start: [14, 27],
                end: [14, 27]
            })
            assert.deepEqual(getArrayIntersection(suggestedSnippets, notExpectedSnippets), [])
        })
    })

    suite('Edge Cases', () => {
        test('Requested completion in state name position does not throw error', async () => {
            await assert.doesNotReject(getCompletions(completionsEdgeCase1, [22, 7]), TypeError)

            await assert.doesNotReject(getCompletions(completionsEdgeCase2, [4, 7]), TypeError)
        })
    })
})
