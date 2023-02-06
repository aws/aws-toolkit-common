/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import * as assert from 'assert'
import { CompletionItemKind, InsertTextFormat } from 'vscode-json-languageservice'
import { CompletionList, Position, Range, TextDocumentPositionParams } from 'vscode-languageserver'
import { TextEdit } from 'vscode-languageserver-textdocument'
import { forceServiceConnection } from '../../../../../test/utils/service'
import { stateSnippets } from '../completion/completeSnippets'
import { service as yamlService } from '../yaml'
import { toDocument } from './utils/testUtilities'

const emptyDocument = ''

const documentWithPartialTopLevel = `
St
`

const documentWithStates = `

StartAt:

States:
\u0020\u0020
`

const document1 = `
  StartAt:
  States:
    FirstState:
    ChoiceState:
    FirstMatchState:
    SecondMatchState:
    DefaultState:
    NextState:
      Next: ""
    ChoiceStateX:
      Type: Choice
      Choices:
        - Next: ""
        - Next: FirstState
        - Next: NextState
      Default: ""
`
const document2 = `
  StartAt:
  States:
    FirstState:
    ChoiceState:
    FirstMatchState:
    SecondMatchState:
    DefaultState:
    NextState:
      Next: ""
    ChoiceStateX:
      Type: Choice,
      Choices:
        - Next: ""
        - Next: FirstState
        - Next: NextState
      Default: ""
`

const document3 = `
  StartAt: ""
  States:
    FirstState:
    ChoiceState:
    FirstMatchState:
    SecondMatchState:
    DefaultState:
    NextState:
      Next: ""
    ChoiceStateX:
`
const document4 = `
  StartAt: First
  States:
    FirstState:
    ChoiceState:
    FirstMatchState:
    SecondMatchState:
    DefaultState:
    NextState:
      Next: First
    ChoiceStateX:
`

const documentNested = `
  StartAt: First
  States:
    FirstState:
    MapState:
      Iterator:
        StartAt: ""
        States:
          Nested1:
          Nested2:
          Nested3:
          Nested4:
            Next: ""
`
const completionsEdgeCase1 = `
  Comment: An example of the Amazon States Language using a map state to process elements of an array with a max concurrency of 2.
  StartAt: Map
  States:
    Map:
      Type: Map
      ItemsPath: $.array
      ResultPath: $$$.array$$$
      MaxConcurrency: 2
      Next: Final State
      Iterator:
        StartAt: Pass
        States:
          Pass:
            Type: Pass
            Result: Done!
            End: true
    "Net 2":
      Type: Fail
      Next: Final State
    Final State:
      Type: Pass
      Next: "Net 2"
`

const completionsEdgeCase2 = `
  StartAt: MyState
  States:

`

const snippetsCompletionCase1 = `
StartAt: Hello
States:
\u0020\u0020
  Hello:
    Type: Pass
    Result: Hello
    Next: World

  World:
    Type: Pass
    Result: World
    End: true
`

const snippetsCompletionCase2 = `
StartAt: Hello
States:
  Hello:
    Type: Pass
    Result: Hello
    Next: World
  World:
    Type: Pass
    Result: World
    End: true
`

const snippetsCompletionCase3 = `
StartAt: Hello
States:
  Hello:
    Type: Pass
    Result: Hello
    Next: World
\u0020\u0020

  World:
    Type: Pass
    Result: World
    End: true
`

const snippetsCompletionCase4 = `
StartAt: Hello
States:
  Hello:
    Type: Pass
    Result: Hello
    Next: World

  World:
    Type: Pass
    Result: World
    End: true
\u0020\u0020\u0020\u0020
`

const snippetsCompletionCase5 = `
StartAt: Hello
States:
  Hello:
    Type: Pass
    Result: Hello
    Next: World

  World:
    Type: Pass
    Result: World
    End: true


\u0020\u0020
`

const snippetsCompletionWithinMap = `
StartAt: Map
States:
  Map:
    Type: Map
    Next: Final State
    Iterator:
      StartAt: Pass
      States:
        Pass:
          Type: Pass
          Result: Done!
          End: true
\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020
  Final State:
    Type: Pass
    End: true
`

const snippetsCompletionWithinParallel = `
StartAt: Parallel
States:
  Parallel:
    Type: Parallel
    Next: Final State
    Branches:
    - StartAt: Wait 20s
      States:
        Wait 20s:
          Type: Wait
          Seconds: 20
          End: true
\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020
  Final State:
    Type: Pass
    End: true
`

const catchRetrySnippetsCompletionWithinMap = `
StartAt: Map
States:
  Map:
    Type: Map
    Next: Final State
\u0020\u0020\u0020\u0020
    Iterator:
      StartAt: Pass
      States:
        Pass:
          Type: Pass
          Result: Done!
          End: true
  Final State:
    Type: Pass
    End: true
`

const catchRetrySnippetsCompletionWithinParallel = `
StartAt: Parallel
States:
  Parallel:
\u0020\u0020\u0020\u0020
    Type: Parallel
    Next: Final State
    Branches:
    - StartAt: Wait 20s
      States:
        Wait 20s:
          Type: Wait
          Seconds: 20
          End: true
  Final State:
    Type: Pass
    End: true
\u0020\u0020\u0020\u0020
\u0020\u0020
`

const catchRetrySnippetsCompletionWithinTask = `
StartAt: FirstState
States:
  FirstState:
    Type: Task

\u0020\u0020\u0020\u0020

    Resource: 'arn:aws:lambda:REGION:ACCOUNT_ID:function:FUNCTION_NAME'
    End: true
`

const topLevelLabels = ['Version', 'Comment', 'TimeoutSeconds', 'StartAt', 'States']
const stateSnippetLabels = [
    'Pass State',
    'Lambda Task State',
    'EventBridge Task State',
    'SNS Task State',
    'Batch Task State',
    'ECS Task State',
    'SQS Task State',
    'Choice State',
    'Wait State',
    'Succeed State',
    'Fail State',
    'Parallel State',
    'Map State'
]

const stateNameLabels = [
    'FirstState',
    'ChoiceState',
    'FirstMatchState',
    'SecondMatchState',
    'DefaultState',
    'NextState',
    'ChoiceStateX'
]
const nestedItemLabels = ['Nested1', 'Nested2', 'Nested3', 'Nested4']

// tslint:disable-next-line: no-invalid-template-strings
const passSnippetYaml =
    '${1:PassState}:\n\tType: Pass\n\tResult:\n\t\tdata1: 0.5\n\t\tdata2: 1.5\n\tResultPath: $.result\n\tNext: ${2:NextState}\n'

interface TestCompletionOptions {
    labels: string[]
    yaml: string
    position: [number, number]
    start: [number, number]
    end: [number, number]
    labelToInsertText(label: string): string
}

interface TestPropertyCompletionOptions {
    labels: string[]
    yaml: string
    position: [number, number]
}

async function getCompletions(yaml: string, position: [number, number]): Promise<CompletionList> {
    const { textDoc } = toDocument(yaml, true)
    const pos = Position.create(...position)

    const params = {
        textDocument: textDoc,
        position: pos
    } as TextDocumentPositionParams
    forceServiceConnection()
    return (await yamlService().completion(textDoc, params)) as CompletionList
}

async function testCompletions(options: TestCompletionOptions) {
    const { labels, yaml, position, start, end, labelToInsertText } = options

    const res = await getCompletions(yaml, position)

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

// Validate completions that include a full property (key-val pair)
async function testPropertyCompletions(options: TestPropertyCompletionOptions) {
    const { labels, yaml, position } = options

    const res = await getCompletions(yaml, position)

    assert.strictEqual(res?.items.length, labels.length)

    const itemLabels = res?.items.map(item => item.label)
    assert.deepEqual(itemLabels, labels)

    // Test property keys match labels.
    const itemInsertTextKeys = res?.items.map(item => item.insertText?.split(':')[0])
    assert.deepEqual(itemInsertTextKeys, labels)

    // Test textEdit newText matches the insertText
    const itemInsertTexts = res?.items.map(item => item.insertText)
    const itemTextEditNewTexts = res?.items.map(item => item.textEdit?.newText)
    assert.deepEqual(itemInsertTexts, itemTextEditNewTexts)

    // Test range is from position to end of line.
    const leftPos = Position.create(position[0], 0)
    const rightPos = Position.create(position[0], yaml.length)
    res?.items.forEach(item => {
        assert.deepEqual((item.textEdit as TextEdit)?.range, Range.create(leftPos, rightPos))
    })
}

interface TestScenario {
    yaml: string
    position: [number, number]
    start: [number, number]
    end: [number, number]
}

export async function getSuggestedSnippets(options: TestScenario) {
    const { yaml, position } = options
    const { textDoc } = toDocument(yaml)
    const pos = Position.create(...position)
    const params = {
        textDocument: textDoc,
        position: pos
    } as TextDocumentPositionParams
    forceServiceConnection()
    const res = (await yamlService().completion(textDoc, params)) as CompletionList
    const suggestedSnippetLabels = res?.items
        .filter(item => item.kind === CompletionItemKind.Snippet)
        .map(item => item.label)

    return suggestedSnippetLabels
}

suite('ASL YAML context-aware completion', () => {
    suite('Top Level Properties', () => {
        test('Empty document', async () => {
            await testPropertyCompletions({
                labels: topLevelLabels,
                yaml: emptyDocument,
                position: [0, 0]
            })
        })

        test('Partially defined property, cursor in front of first letter', async () => {
            await testPropertyCompletions({
                labels: topLevelLabels,
                yaml: documentWithPartialTopLevel,
                position: [1, 0]
            })
        })

        test('Partially defined property, cursor in middle', async () => {
            await testPropertyCompletions({
                labels: topLevelLabels,
                yaml: documentWithPartialTopLevel,
                position: [1, 1]
            })
        })

        test('Partially defined property, cursor after final letter', async () => {
            await testPropertyCompletions({
                labels: topLevelLabels,
                yaml: documentWithPartialTopLevel,
                position: [1, 2]
            })
        })

        test('States snippets', async () => {
            const labels = stateSnippetLabels
            const yaml = documentWithStates

            const res = await getCompletions(yaml, [5, 2])

            assert.strictEqual(res?.items.length, labels.length)

            const itemLabels = res?.items.map(item => item.label)
            assert.deepEqual(itemLabels, labels)

            res?.items.forEach(item => {
                assert.strictEqual(item.kind, CompletionItemKind.Snippet)
                assert.strictEqual(item.insertTextFormat, InsertTextFormat.Snippet)
                assert.ok(item.insertText)
                assert.ok(item.documentation)
            })
        })
    })

    suite('StartAt', () => {
        test('Both quotation marks present and cursor between them', async () => {
            await testCompletions({
                labels: stateNameLabels,
                yaml: document3,
                position: [1, 12],
                start: [1, 10],
                end: [1, 13],
                labelToInsertText: label => ` ${label}`
            })
        })

        test('Suggests completions when text present and cursor is on it', async () => {
            await testCompletions({
                labels: stateNameLabels,
                yaml: document4,
                position: [1, 13],
                start: [1, 10],
                end: [1, 16],
                labelToInsertText: label => ` ${label}`
            })
        })

        test('Suggests nested completions when StartAt is nested within Map state', async () => {
            await testCompletions({
                labels: nestedItemLabels,
                yaml: documentNested,
                position: [6, 18],
                start: [6, 16],
                end: [6, 19],
                labelToInsertText: label => ` ${label}`
            })
        })
    })

    suite('Next', () => {
        test('Cursor after colon but no quotes', async () => {
            await testCompletions({
                // remove last label as it is the name of the current state
                labels: stateNameLabels.filter(label => label !== 'NextState'),
                yaml: document2,
                position: [9, 12],
                start: [9, 11],
                end: [9, 14],
                labelToInsertText: label => ` ${label}`
            })
        })

        test('Both quotation marks present and cursor between them', async () => {
            await testCompletions({
                // remove last label as it is the name of the current state
                labels: stateNameLabels.filter(label => label !== 'NextState'),
                yaml: document3,
                position: [9, 13],
                start: [9, 11],
                end: [9, 14],
                labelToInsertText: label => ` ${label}`
            })
        })

        test('Suggests completions when text present and cursor is on it', async () => {
            await testCompletions({
                // remove last label as it is the name of the current state
                labels: stateNameLabels.filter(label => label !== 'NextState'),
                yaml: document4,
                position: [9, 18],
                start: [9, 11],
                end: [9, 17],
                labelToInsertText: label => ` ${label}`
            })
        })

        test('Suggests nested completions when Next is nested within Map state', async () => {
            await testCompletions({
                // remove last label as it is the name of the current state
                labels: nestedItemLabels.filter(label => label !== 'Nested4'),
                yaml: documentNested,
                position: [12, 21],
                start: [12, 17],
                end: [12, 20],
                labelToInsertText: label => ` ${label}`
            })
        })

        test('Suggests completions for the Next property within Choice state', async () => {
            await testCompletions({
                labels: stateNameLabels.filter(label => label !== 'ChoiceStateX'),
                yaml: document1,
                position: [13, 17],
                start: [13, 15],
                end: [13, 18],
                labelToInsertText: label => ` ${label}`
            })
        })
    })

    suite('Default', () => {
        test('Suggests completion items for Default property of the Choice state when cursor positioned after first quote', async () => {
            await testCompletions({
                labels: stateNameLabels.filter(label => label !== 'ChoiceStateX'),
                yaml: document1,
                position: [16, 16],
                start: [16, 14],
                end: [16, 17],
                labelToInsertText: label => ` ${label}`
            })
        })

        test('Suggests completion items for Default property of the Choice state when cursor is a space after colon', async () => {
            await testCompletions({
                labels: stateNameLabels.filter(label => label !== 'ChoiceStateX'),
                yaml: document2,
                position: [16, 15],
                start: [16, 14],
                end: [16, 17],
                labelToInsertText: label => ` ${label}`
            })
        })
    })

    suite('Edge Cases', () => {
        test('Requested completion in state name position does not throw error', async () => {
            await assert.doesNotReject(getCompletions(completionsEdgeCase1, [17, 4]), TypeError)

            await assert.doesNotReject(getCompletions(completionsEdgeCase2, [3, 5]), TypeError)
        })
    })

    suite('Snippets', () => {
        suite('State snippets', () => {
            test('Shows state snippets when cursor placed on first line after States prop with greater indendation', async () => {
                const expectedSnippets = stateSnippets.map(item => item.label)
                const suggestedSnippets = await getSuggestedSnippets({
                    yaml: snippetsCompletionCase1,
                    position: [3, 2],
                    start: [3, 2],
                    end: [3, 2]
                })

                assert.deepEqual(suggestedSnippets, expectedSnippets)
            })

            test('Does not show state snippets when cursor placed on first line after States prop with same indentation indendation', async () => {
                const suggestedSnippets = await getSuggestedSnippets({
                    yaml: snippetsCompletionCase2,
                    position: [3, 0],
                    start: [3, 0],
                    end: [3, 0]
                })

                assert.deepEqual(suggestedSnippets, [])
            })

            test('Shows state snippets when cursor placed on line after state declaration with the indentation same as the previous state name', async () => {
                const expectedSnippets = stateSnippets.map(item => item.label)
                const suggestedSnippets = await getSuggestedSnippets({
                    yaml: snippetsCompletionCase3,
                    position: [7, 2],
                    start: [7, 2],
                    end: [7, 2]
                })

                assert.deepEqual(suggestedSnippets, expectedSnippets)
            })

            test('Does not show state snippets when cursor placed on line after state declaration with the indentation same as the nested state property name ', async () => {
                const suggestedSnippets = await getSuggestedSnippets({
                    yaml: snippetsCompletionCase4,
                    position: [7, 4],
                    start: [7, 4],
                    end: [7, 4]
                })

                assert.deepEqual(suggestedSnippets, [])
            })

            test('Shows state snippets when cursor placed 2 lines below last declared state machine with same indentation level as its name', async () => {
                const expectedSnippets = stateSnippets.map(item => item.label)
                const suggestedSnippets = await getSuggestedSnippets({
                    yaml: snippetsCompletionCase5,
                    position: [14, 2],
                    start: [14, 2],
                    end: [14, 2]
                })

                assert.deepEqual(suggestedSnippets, expectedSnippets)
            })

            test('Shows state snippets when cursor placed within States object of Map state', async () => {
                const expectedSnippets = stateSnippets.map(item => item.label)
                const suggestedSnippets = await getSuggestedSnippets({
                    yaml: snippetsCompletionWithinMap,
                    position: [13, 8],
                    start: [13, 8],
                    end: [13, 8]
                })

                assert.deepEqual(suggestedSnippets, expectedSnippets)
            })

            test('Shows state snippets when cursor placed within States object of Parallel state', async () => {
                const expectedSnippets = stateSnippets.map(item => item.label)
                const suggestedSnippets = await getSuggestedSnippets({
                    yaml: snippetsCompletionWithinParallel,
                    position: [13, 8],
                    start: [13, 8],
                    end: [13, 8]
                })

                assert.deepEqual(suggestedSnippets, expectedSnippets)
            })

            test('Shows the snippets in correct YAML format', async () => {
                const { textDoc } = toDocument(snippetsCompletionCase1, true)
                const pos = Position.create(3, 2)
                const params = {
                    textDocument: textDoc,
                    position: pos
                } as TextDocumentPositionParams
                forceServiceConnection()
                const res = (await yamlService().completion(textDoc, params)) as CompletionList

                assert.ok(res?.items.find(item => item.insertText === passSnippetYaml))
            })
        })

        suite('Catch/Retry snippets', () => {
            test('Shows error snippets when cursor placed within map state', async () => {
                const expectedSnippets = ['Retry', 'Catch']
                const suggestedSnippets = await getSuggestedSnippets({
                    yaml: catchRetrySnippetsCompletionWithinMap,
                    position: [6, 4],
                    start: [6, 4],
                    end: [6, 4]
                })

                assert.deepEqual(suggestedSnippets, expectedSnippets)
            })

            test('Shows error snippets when cursor placed within parallel state', async () => {
                const expectedSnippets = ['Retry', 'Catch']
                const suggestedSnippets = await getSuggestedSnippets({
                    yaml: catchRetrySnippetsCompletionWithinParallel,
                    position: [4, 4],
                    start: [4, 4],
                    end: [4, 4]
                })

                assert.deepEqual(suggestedSnippets, expectedSnippets)
            })

            test('Shows error snippets when cursor placed within task state', async () => {
                const expectedSnippets = ['Retry', 'Catch']
                const suggestedSnippets = await getSuggestedSnippets({
                    yaml: catchRetrySnippetsCompletionWithinTask,
                    position: [6, 4],
                    start: [6, 4],
                    end: [6, 4]
                })

                assert.deepEqual(suggestedSnippets, expectedSnippets)
            })

            test('Does not show error snippets outside of allowed states', async () => {
                const notExpectedSnippets = ['Retry', 'Catch']
                const suggestedSnippetsOtherState = await getSuggestedSnippets({
                    yaml: catchRetrySnippetsCompletionWithinParallel,
                    position: [17, 4],
                    start: [17, 4],
                    end: [17, 4]
                })

                assert.equal(
                    suggestedSnippetsOtherState?.filter(snippet => notExpectedSnippets.includes(snippet)).length,
                    0
                )

                const suggestedSnippetsStatePropLevel = await getSuggestedSnippets({
                    yaml: catchRetrySnippetsCompletionWithinParallel,
                    position: [18, 4],
                    start: [18, 4],
                    end: [18, 4]
                })

                assert.equal(
                    suggestedSnippetsStatePropLevel?.filter(snippet => notExpectedSnippets.includes(snippet)).length,
                    0
                )
            })
        })
    })
})
